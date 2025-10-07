import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { isLoggedIn, user, logout, updateUser } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });

  if (!isLoggedIn) {
    return (
      <div className="w-full" style={{ padding: '24px 0', marginLeft:"380px" }}>
        <div className="container max-width" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="summary-card" style={{ maxWidth: 520, textAlign: 'center' }}>
            <h3>Please log in to view your profile</h3>
          </div>
        </div>
      </div>
    );
  }

  const submitEdit = (e) => {
    e.preventDefault();
    updateUser(form);
    setOpenEdit(false);
  };

  return (
    <div className="" style={{ background: '#f9fafb', padding: '32px 0', marginLeft:"550px" }}>
      <div className="container max-width">
        <div className="profile-card rounded-xl shadow-md" style={{ background: 'white', border: '1px solid #e5e7eb', padding: 24 }}>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div className="grid-desktop" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
              {/* Left: Avatar + quick details */}
              <div className="left-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div className="avatar" style={{ width: 120, height: 120, borderRadius: '9999px', background: '#eef2ff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#4f46e5' }}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="quick-details" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{user?.name}</div>
                  <div style={{ color: '#6b7280', marginTop: 4 }}>{user?.email}</div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="add-to-cart-btn" onClick={() => setOpenEdit(true)}>Edit Profile</button>
                  <button className="view-details-btn" onClick={logout}>Logout</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {openEdit && (
        <div className="modal-overlay" onClick={() => setOpenEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-btn" onClick={() => setOpenEdit(false)}>×</button>
            </div>
            <form className="modal-body" onSubmit={submitEdit}>
              <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <div className="modal-actions">
                <button type="submit" className="add-to-cart-btn">Save</button>
                <button type="button" className="view-details-btn" onClick={() => setOpenEdit(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


