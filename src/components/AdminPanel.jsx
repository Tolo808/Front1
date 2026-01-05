import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminPanel.css";

const API_URL = "https://backend-production-4394.up.railway.app/api/drivers";

export default function AdminPanel() {
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({ name: "", phone: "", vehicle_plate: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    const res = await axios.get(API_URL);
    setDrivers(res.data);
  };

  const openModal = (driver = null) => {
    if (driver) {
      setEditingId(driver._id);
      setFormData({ name: driver.name, phone: driver.phone, vehicle: driver.vehicle_plate });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", vehicle_plate: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", vehicle_plate: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit Mode
        await axios.put(`${API_URL}/edit/${editingId}`, formData);
      } else {
        // Add Mode
        await axios.post(`${API_URL}/add`, formData);
      }
      fetchDrivers();
      closeModal();
    } catch (err) {
      alert("Error saving driver");
    }
  };

  const deleteDriver = async (id) => {
    if (window.confirm("Delete this driver?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchDrivers();
    }
  };

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <h2>Admin Management</h2>
        <div className="nav-btns">
          <button className="add-main-btn" onClick={() => openModal()}>+ Add Driver</button>
          <button onClick={() => window.location.href = "/admin-choice"}>Back</button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="table-card">
          <div className="table-header">
            <h3>Driver Directory</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.phone}</td>
                  <td>{d.vehicle_plate}</td>
                  <td>
                    <button onClick={() => openModal(d)} className="edit-btn">Edit</button>
                    <button onClick={() => deleteDriver(d._id)} className="del-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{editingId ? "Update Driver" : "Add New Driver"}</h3>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" placeholder="Name" required 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
              <input 
                type="text" placeholder="Phone" required 
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
              <input 
                type="text" placeholder="Vehicle" 
                value={formData.vehicle_plate} onChange={(e) => setFormData({...formData, vehicle: e.target.value})} 
              />
              <div className="modal-actions">
                <button type="submit" className="add-btn">
                  {editingId ? "Update Info" : "Save Driver"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
