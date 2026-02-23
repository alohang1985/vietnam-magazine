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

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('posting');
    try {
      const res = await fetch('/api/admin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const json = await res.json();
      if (res.ok) setStatus({ ok: true, msg: json.message || 'Success' });
      else setStatus({ ok: false, msg: json.error || JSON.stringify(json) });
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
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <h1>관리자 포스팅 생성</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="여기에 긴 내용을 붙여넣으세요 (사용자 제공 글)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', height: 400, fontSize: 16, padding: 12 }}
        />
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ padding: '10px 18px', fontSize: 16 }}>포스팅 생성</button>
        </div>
      </form>
      <div style={{ marginTop: 16 }}>
        {status === 'posting' && <div>⏳ 생성 중...</div>}
        {status && status !== 'posting' && (
          <div style={{ color: status.ok ? 'green' : 'red' }}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}
