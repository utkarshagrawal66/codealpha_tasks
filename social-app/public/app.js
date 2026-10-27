const $app = document.getElementById('app'), $nav = document.getElementById('nav');
let me = null;

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
async function api(url, { method = 'GET', body } = {}) {
  const o = { method, credentials: 'same-origin' };
  if (body instanceof FormData) o.body = body;
  else if (body) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(body); }
  const r = await fetch('/api' + url, o);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.');
  return d;
}
const toast = (m) => { const t = h('div', { class: 'toast' }, m); document.body.append(t); setTimeout(() => t.remove(), 3000); };
const ago = (s) => { const m = (Date.now() - new Date(s.replace(' ', 'T') + 'Z')) / 6e4; return m < 1 ? 'now' : m < 60 ? Math.floor(m) + 'm' : m < 1440 ? Math.floor(m / 60) + 'h' : Math.floor(m / 1440) + 'd'; };
const avatar = (u, cls = '') => u.avatar_path
  ? h('img', { class: 'av ' + cls, src: '/uploads/' + u.avatar_path, alt: '' })
  : h('div', { class: 'av ph ' + cls }, (u.display_name || u.username)[0].toUpperCase());
const field = (name, label, type = 'text') => h('label', {}, label, h('input', { name, type, required: true }));

function renderNav() {
  $nav.replaceChildren(h('a', { class: 'brand', href: '#/' }, 'Loop'),
    ...(me ? [h('a', { href: '#/' }, 'Home'), h('a', { href: '#/search' }, 'Search'), h('a', { href: '#/u/' + me.username }, 'Profile'), h('button', { onclick: logout }, 'Log out')]
           : [h('a', { href: '#/login' }, 'Log in'), h('a', { href: '#/register' }, 'Sign up')]));
}

function followBtn(u, after = () => {}) {
  const set = () => { b.className = 'btn' + (u.is_following ? ' ghost' : ''); b.textContent = u.is_following ? 'Following' : 'Follow'; };
  const b = h('button', { onclick: async () => {
    try {
      await api('/users/' + u.username + '/follow', { method: u.is_following ? 'DELETE' : 'POST' });
      u.is_following = !u.is_following; u.followers += u.is_following ? 1 : -1; set(); after();
    } catch (e) { toast(e.message); }
  } });
  set();
  return b;
}
const userRow = (u) => h('div', { class: 'card urow' },
  h('a', { href: '#/u/' + u.username }, avatar(u)),
  h('div', { class: 'grow' }, h('a', { class: 'name', href: '#/u/' + u.username }, u.display_name || u.username),
    h('p', { class: 'muted', style: 'margin:0' }, '@' + u.username + (u.bio ? ' · ' + u.bio : ''))),
  u.is_me ? null : followBtn(u));

function postCard(p) {
  const like = h('button', { onclick: async () => {
    try {
      await api('/posts/' + p.id + '/like', { method: p.liked ? 'DELETE' : 'POST' });
      p.liked = !p.liked; p.like_count += p.liked ? 1 : -1; draw();
    } catch (e) { toast(e.message); }
  } });
  const draw = () => { like.className = 'act' + (p.liked ? ' on' : ''); like.textContent = (p.liked ? '♥ ' : '♡ ') + p.like_count; };
  draw();
  const card = h('article', { class: 'card post' },
    h('a', { href: '#/u/' + p.username }, avatar(p)),
    h('div', { class: 'body' },
      h('header', {}, h('a', { class: 'name', href: '#/u/' + p.username }, p.display_name || p.username), h('span', { class: 'muted' }, ' @' + p.username + ' · ' + ago(p.created_at))),
      h('p', { class: 'text' }, p.content),
      p.image_path && h('img', { class: 'pimg', src: '/uploads/' + p.image_path, alt: 'Image attached to the post' }),
      h('footer', {}, like, h('a', { class: 'act', href: '#/post/' + p.id }, 'Comments ' + p.comment_count),
        p.username === me.username && h('button', { class: 'act', onclick: async () => {
          if (!confirm('Delete this post?')) return;
          try { await api('/posts/' + p.id, { method: 'DELETE' }); card.remove(); if (location.hash.startsWith('#/post/')) location.hash = '#/'; }
          catch (e) { toast(e.message); }
        } }, 'Delete'))));
  return card;
}

function composer(onPost) {
  const ta = h('textarea', { maxlength: 280, rows: 3, placeholder: "What's happening?" });
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
  const count = h('span', { class: 'muted' }, '280');
  ta.oninput = () => { count.textContent = 280 - ta.value.length; };
  return h('div', { class: 'card composer' }, ta, h('div', { class: 'row' }, file, count, h('button', { class: 'btn', onclick: async () => {
    if (!ta.value.trim()) return toast('Write something first');
    const fd = new FormData(); fd.append('content', ta.value); if (file.files[0]) fd.append('image', file.files[0]);
    try { const p = await api('/posts', { method: 'POST', body: fd }); ta.value = ''; file.value = ''; count.textContent = '280'; onPost(p); }
    catch (e) { toast(e.message); }
  } }, 'Post')));
}

function authView([mode]) {
  const reg = mode === 'register', err = h('p', { class: 'err' });
  const f = h('form', { class: 'card auth', onsubmit: async (ev) => {
    ev.preventDefault();
    try { await api('/auth/' + mode, { method: 'POST', body: Object.fromEntries(new FormData(f)) }); me = await api('/auth/me'); location.hash = '#/'; }
    catch (e) { err.textContent = e.message; }
  } },
    h('h1', {}, reg ? 'Create your account' : 'Welcome back'),
    reg && field('username', 'Username'), reg && field('email', 'Email', 'email'),
    !reg && field('login', 'Username or email'), field('password', 'Password', 'password'),
    err, h('button', { class: 'btn' }, reg ? 'Sign up' : 'Log in'),
    h('p', { class: 'muted' }, reg ? 'Have an account? ' : 'New here? ', h('a', { href: reg ? '#/login' : '#/register' }, reg ? 'Log in' : 'Create an account')));
  $app.replaceChildren(f);
}

async function feedView() {
  const list = h('div', { class: 'list' });
  let page = 1;
  const more = h('button', { class: 'btn ghost', onclick: load }, 'Load more');
  async function load() {
    const d = await api('/feed?page=' + page + '&limit=10');
    d.posts.forEach((p) => list.append(postCard(p)));
    more.hidden = d.posts.length < 10;
    if (page === 1 && !d.posts.length) list.append(h('p', { class: 'empty' }, 'Your feed is empty. Search for people to follow, or write your first post above.'));
    page++;
  }
  $app.replaceChildren(composer((p) => { list.querySelector('.empty')?.remove(); list.prepend(postCard(p)); }), list, more);
  await load();
}

async function profileView([, name, tab]) {
  let u = await api('/users/' + name);
  const head = h('div', { class: 'card profile' });
  const draw = () => head.replaceChildren(avatar(u, 'lg'), h('div', { class: 'pinfo' },
    h('h1', {}, u.display_name || u.username), h('p', { class: 'muted' }, '@' + u.username), u.bio && h('p', {}, u.bio),
    h('p', { class: 'stats' }, h('a', { href: '#/u/' + u.username }, h('b', {}, u.posts), ' posts'),
      h('a', { href: '#/u/' + u.username + '/followers' }, h('b', {}, u.followers), ' followers'),
      h('a', { href: '#/u/' + u.username + '/following' }, h('b', {}, u.following), ' following'))),
    u.is_me ? h('button', { class: 'btn ghost', onclick: edit }, 'Edit profile') : followBtn(u, draw));
  const edit = () => {
    const dn = h('input', { value: u.display_name || '', maxlength: 50 }), bio = h('textarea', { maxlength: 160, rows: 3 }, u.bio || '');
    const f = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    head.replaceChildren(h('div', { class: 'pinfo', style: 'display:grid;gap:10px' },
      h('label', {}, 'Display name', dn), h('label', {}, 'Bio', bio), h('label', {}, 'Profile photo', f),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => {
        const fd = new FormData(); fd.append('display_name', dn.value); fd.append('bio', bio.value); if (f.files[0]) fd.append('avatar', f.files[0]);
        try { u = await api('/users/me', { method: 'PUT', body: fd }); me = await api('/auth/me'); renderNav(); draw(); } catch (e) { toast(e.message); }
      } }, 'Save changes'), h('button', { class: 'btn ghost', onclick: draw }, 'Cancel'))));
  };
  draw();
  $app.replaceChildren(head);
  if (tab === 'followers' || tab === 'following') {
    const d = await api('/users/' + name + '/' + tab);
    $app.append(...(d.users.length ? d.users.map(userRow) : [h('p', { class: 'empty' }, 'No ' + tab + ' yet.')]));
  } else {
    const d = await api('/users/' + name + '/posts?limit=30');
    $app.append(...(d.posts.length ? d.posts.map(postCard) : [h('p', { class: 'empty' }, u.is_me ? "You haven't posted yet. Share your first post from Home." : 'No posts yet.')]));
  }
}

async function postView([, id]) {
  const p = await api('/posts/' + id), list = h('div', { class: 'list' });
  const addC = (c) => {
    const row = h('div', { class: 'card comment' }, h('a', { href: '#/u/' + c.username }, avatar(c, 'sm')),
      h('div', { class: 'body' }, h('a', { class: 'name', href: '#/u/' + c.username }, c.display_name || c.username), h('span', { class: 'muted' }, ' · ' + ago(c.created_at)), h('p', { class: 'text' }, c.content)),
      c.username === me.username && h('button', { class: 'act', onclick: async () => { try { await api('/comments/' + c.id, { method: 'DELETE' }); row.remove(); } catch (e) { toast(e.message); } } }, 'Delete'));
    list.append(row);
  };
  const inp = h('input', { maxlength: 280, placeholder: 'Write a comment' });
  const send = async () => {
    if (!inp.value.trim()) return;
    try { addC(await api('/posts/' + id + '/comments', { method: 'POST', body: { content: inp.value } })); inp.value = ''; } catch (e) { toast(e.message); }
  };
  inp.onkeydown = (e) => e.key === 'Enter' && send();
  $app.replaceChildren(postCard(p), h('div', { class: 'card row' }, inp, h('button', { class: 'btn', onclick: send }, 'Reply')), list);
  (await api('/posts/' + id + '/comments')).comments.forEach(addC);
}

function searchView([, q = '']) {
  const out = h('div', { class: 'list' }), inp = h('input', { type: 'search', placeholder: 'Search by name or username', value: decodeURIComponent(q) });
  let t;
  const run = async () => {
    const v = inp.value.trim();
    if (!v) return out.replaceChildren(h('p', { class: 'empty' }, 'Type a name or username to find people.'));
    try { const d = await api('/users/search?q=' + encodeURIComponent(v)); out.replaceChildren(...(d.users.length ? d.users.map(userRow) : [h('p', { class: 'empty' }, 'No one matches "' + v + '".')])); }
    catch (e) { toast(e.message); }
  };
  inp.oninput = () => { clearTimeout(t); t = setTimeout(run, 250); };
  $app.replaceChildren(h('div', { class: 'card' }, inp), out);
  inp.focus(); run();
}

async function route() {
  const seg = (location.hash.slice(1) || '/').split('/').filter(Boolean);
  renderNav();
  const authPage = ['login', 'register'].includes(seg[0]);
  if (!me && !authPage) { location.hash = '#/login'; return; }
  if (me && authPage) { location.hash = '#/'; return; }
  const view = { login: authView, register: authView, u: profileView, post: postView, search: searchView }[seg[0]] || feedView;
  try { await view(seg); } catch (e) { $app.replaceChildren(h('p', { class: 'empty' }, e.message)); }
}
async function logout() { await api('/auth/logout', { method: 'POST' }); me = null; location.hash = '#/login'; }
(async () => {
  try { me = await api('/auth/me'); } catch { me = null; }
  window.addEventListener('hashchange', route);
  route();
})();
