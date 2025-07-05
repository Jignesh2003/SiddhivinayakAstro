// src/pages/AdminProfiles.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Toaster, toast } from 'react-hot-toast'
import { Edit2, Trash2, PlusCircle } from 'lucide-react'

export default function UpdateNumerology() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState({
    number: '', type: 'life_path', title: '', description: '',
    positive: '', negative: '',
    compatible: '', challenging: ''
  })

  // fetch on mount
  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_NUMEROLOGY_URL}/profiles`)
      setProfiles(data)
    } catch (err) {
        console.log(err);
        
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      number: '', type: 'life_path', title: '', description: '',
      positive: '', negative: '',
      compatible: '', challenging: ''
    })
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const body = {
        number: parseInt(form.number,10),
        type: form.type,
        title: form.title,
        description: form.description,
        traits: {
          positive: form.positive.split(',').map(s=>s.trim()),
          negative: form.negative.split(',').map(s=>s.trim())
        },
        compatibility: {
          compatible_with: form.compatible.split(',').map(n=>parseInt(n,10)),
          challenging_with: form.challenging.split(',').map(n=>parseInt(n,10))
        }
      }
      if (editing) {
        await axios.put(`${import.meta.env.VITE_NUMEROLOGY_URL}/profiles/${editing}`, body)
        toast.success('Updated')
      } else {
        await axios.post(`${import.meta.env.VITE_NUMEROLOGY_URL}/profiles`, body)
        toast.success('Created')
      }
      resetForm()
      fetchProfiles()
    } catch (err) {
      console.error(err)
      toast.error('Save failed')
    }
  }

  const handleEdit = p => {
    setEditing(p._id)
    setForm({
      number:     p.number,
      type:       p.type,
      title:      p.title || '',
      description:p.description || '',
      positive:   (p.traits.positive||[]).join(', '),
      negative:   (p.traits.negative||[]).join(', '),
      compatible: (p.compatibility.compatible_with||[]).join(', '),
      challenging:(p.compatibility.challenging_with||[]).join(', ')
    })
    window.scrollTo(0,0)
  }

  const handleDelete = async id => {
    if (!confirm('Delete this profile?')) return
    try {
      await axios.delete(`${import.meta.env.VITE_NUMEROLOGY_URL}/profiles/${id}`)
      toast.success('Deleted')
      fetchProfiles()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-4">📝 Admin: Numerology Profiles</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {editing ? 'Edit Profile' : 'New Profile'}{' '}
          <PlusCircle className="inline h-5 w-5 text-green-500 cursor-pointer" onClick={resetForm}/>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block">Number</label>
            <input
              name="number"
              type="number"
              value={form.number}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="life_path">Life Path</option>
              <option value="expression">Expression</option>
              <option value="soul_urge">Soul Urge</option>
              <option value="birthday">Birthday</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="col-span-2">
            <label className="block">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Positive Traits<br/>
              <small className="text-xs">comma‑separated</small>
            </label>
            <input
              name="positive"
              value={form.positive}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Negative Traits<br/>
              <small className="text-xs">comma‑separated</small>
            </label>
            <input
              name="negative"
              value={form.negative}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Compatible With<br/>
              <small className="text-xs">numbers, comma‑separated</small>
            </label>
            <input
              name="compatible"
              value={form.compatible}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Challenging With<br/>
              <small className="text-xs">numbers, comma‑separated</small>
            </label>
            <input
              name="challenging"
              value={form.challenging}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editing ? 'Update' : 'Create'}
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">#</th>
              <th className="p-2">Type</th>
              <th className="p-2">Number</th>
              <th className="p-2">Title</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan="5" className="p-4 text-center">Loading…</td></tr>
              : profiles.map(p => (
                <tr key={p._id} className="border-b">
                  <td className="p-2">{p._id.slice(-4)}</td>
                  <td className="p-2">{p.type.replace('_',' ')}</td>
                  <td className="p-2">{p.number}</td>
                  <td className="p-2">{p.title}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={()=>handleEdit(p)}>
                      <Edit2 className="inline h-5 w-5 text-blue-500"/>
                    </button>
                    <button onClick={()=>handleDelete(p._id)}>
                      <Trash2 className="inline h-5 w-5 text-red-500"/>
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
)
}
