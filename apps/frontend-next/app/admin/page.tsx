"use client";
import { useState } from 'react';

export default function AdminPostPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [password, setPassword] = useState('');

  async function checkPassword(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setAuthChecked(true);
      } else {
        setAuthError(json.message || '접근 거부');
      }
    } catch (e) {
      setAuthError(e.message);
    }
  }

  const [posts, setPosts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  async function loadPosts() {
    try {
      const res = await fetch('/api/admin/posts');
      const json = await res.json();
      if (res.ok) setPosts(json.data || json);
      else console.error('Failed to load posts', json);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('posting');
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/admin/posts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_markdown: text })
        });
      } else {
        res = await fetch('/api/admin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
      }
      const json = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: json.message || 'Success' });
        setText('');
        setEditingId(null);
        await loadPosts();
      } else setStatus({ ok: false, msg: json.error || JSON.stringify(json) });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    }
  }

  async function startEdit(post) {
    setEditingId(post.id || (post.attributes && post.attributes.id));
    const content = post.attributes ? post.attributes.article_markdown : (post.article_markdown || '');
    setText(content);
  }

  async function handleDelete(post) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const id = post.id || (post.attributes && post.attributes.id);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: '삭제되었습니다' });
        await loadPosts();
      } else setStatus({ ok: false, msg: json.error || JSON.stringify(json) });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    }
  }

  if (!authChecked) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
        <h1>관리자 로그인</h1>
        <form onSubmit={checkPassword}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit" style={{ padding: '8px 14px' }}>확인</button>
          </div>
        </form>
        {authError && <div style={{ color: 'red', marginTop: 12 }}>{authError}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 20 }}>
      <h1>관리자 포스팅 관리</h1>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h2>게시물 목록</h2>
          <button onClick={loadPosts} style={{ marginBottom: 8 }}>목록 새로고침</button>
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
            {posts && posts.length ? posts.map((p) => {
              const id = p.id || (p.attributes && p.attributes.id);
              const title = p.attributes ? p.attributes.title : (p.title || 'Untitled');
              return (
                <div key={id} style={{ padding: 8, borderBottom: '1px solid #f3f3f3' }}>
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => startEdit(p)} style={{ marginRight: 8 }}>수정</button>
                    <button onClick={() => handleDelete(p)} style={{ color: 'red' }}>삭제</button>
                  </div>
                </div>
              );
            }) : <div>게시물이 없습니다</div>}
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <h2>{editingId ? '게시물 수정' : '새 포스팅 생성'}</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="여기에 긴 내용을 붙여넣으세요 (사용자 제공 글)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: '100%', height: 400, fontSize: 16, padding: 12 }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" style={{ padding: '10px 18px', fontSize: 16 }}>{editingId ? '저장' : '포스팅 생성'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setText(''); }} style={{ marginLeft: 8 }}>취소</button>}
            </div>
          </form>
          <div style={{ marginTop: 16 }}>
            {status === 'posting' && <div>⏳ 생성 중...</div>}
            {status && status !== 'posting' && (
              <div style={{ color: status.ok ? 'green' : 'red' }}>{status.msg}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
