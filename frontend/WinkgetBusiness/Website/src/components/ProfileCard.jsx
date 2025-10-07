import React, { useState } from 'react'

export default function ProfileCard({ vendor, onUpdate }) {
  const [form, setForm] = useState({ name: vendor?.name || '', email: vendor?.email || '', avatarUrl: vendor?.avatarUrl || '' })

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    onUpdate?.(form)
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl">
          {(form.name || 'V')[0]}
        </div>
        <div>
          <h3 className="font-semibold">{form.name || 'Vendor'}</h3>
          <p className="text-sm text-gray-600">{form.email || 'example@vendor.com'}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input name="avatarUrl" value={form.avatarUrl} onChange={handleChange} className="w-full rounded-md border px-3 py-2" placeholder="https://" />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white">Update</button>
        </div>
      </form>
    </div>
  )
}


