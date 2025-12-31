// src/components/Dashboard.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import socket from "../socket";
import "../styles/Dashboard.css";

const BACKEND_URL = "https://backend-production-4394.up.railway.app"; 
const DRIVER_API = "http://192.168.1.2:6000";    // realtime driver delivery

const TABS = ["Pending", "Successful", "Unsuccessful"];
const ORDERS_PER_PAGE = 10;

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [rowLoading, setRowLoading] = useState({});
  const [unsuccessfulModal, setUnsuccessfulModal] = useState({
    open: false,
    orderId: null,
    reason: "",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    username: "",
    source: "web",
    pickup: "",
    dropoff: "",
    sender_phone: "",
    receiver_phone: "",
    full_address: "",
    quantity: "1",
    item_description: "",
    payment_from_sender_or_receiver: "sender",
    delivery_type: "Payable",
    price: "",
  });
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const modalOverlayRef = useRef(null);

  

  const updateOrderInState = (updated) => {
    setOrders((prev) =>
      prev.map((o) => (String(o._id) === String(updated._id) ? updated : o))
    );
  };

  const removeOrderFromState = (orderId) => {
    setOrders((prev) => prev.filter((o) => String(o._id) !== String(orderId)));
  };

  const openUnsuccessfulModal = (orderId) =>
    setUnsuccessfulModal({ open: true, orderId, reason: "" });
  const closeUnsuccessfulModal = () =>
    setUnsuccessfulModal({ open: false, orderId: null, reason: "" });

  const openAddModal = () => {
    setNewDelivery({
      username: "",
      source: "web",
      pickup: "",
      dropoff: "",
      sender_phone: "",
      receiver_phone: "",
      full_address: "",
      quantity: "1",
      item_description: "",
      payment_from_sender_or_receiver: "sender",
      delivery_type: "Payable",
      price: "",
    });
    setAddModalOpen(true);
  };
  const closeAddModal = () => setAddModalOpen(false);

  const handleNewDeliveryChange = (field, value) =>
    setNewDelivery((p) => ({ ...p, [field]: value }));

  const onOverlayClick = (e) => {
    if (e.target === modalOverlayRef.current) closeAddModal();
  };

  // --- Fetch & Socket.IO
  useEffect(() => {
    socket.on("init_orders", (data) => {
      const sorted = (data || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setOrders(sorted);
      setLoading(false);
    });

    socket.on("order_created", (newOrder) => setOrders((prev) => [newOrder, ...prev]));
    socket.on("order_updated", (updated) => updateOrderInState(updated));
    socket.on("order_deleted", (order) => removeOrderFromState(order._id));

    const fetchData = async () => {
      setLoading(true);
      try {
        const resDrivers = await fetch(`${BACKEND_URL}/api/drivers`);
        const driversData = await resDrivers.json();
        setDrivers(Array.isArray(driversData) ? driversData : driversData.drivers || []);

        const resOrders = await fetch(`${BACKEND_URL}/api/deliveries`);
        const dataOrders = await resOrders.json();
        const sorted = (dataOrders || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setOrders(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      socket.off("init_orders");
      socket.off("order_created");
      socket.off("order_updated");
      socket.off("order_deleted");
    };
  }, []);

  // --- Filtered & paginated orders
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const st = (o.status || "").toLowerCase();
      if (activeTab === "Pending") return st === "pending" || !o.status;
      if (activeTab === "Successful") return st === "successful";
      if (activeTab === "Unsuccessful") return st === "unsuccessful";
      return true;
    });
  }, [orders, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );
  // Mark order as successful
const handleMarkSuccessful = async (order) => {
  if (!order._id) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/update_delivery_status/${order._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "successful" }),
    });

    const data = await res.json();

    // Change this line: Check if the request was successful via HTTP status
    if (!res.ok) throw new Error(data.error || "Failed to update status");

    // Socket.io will handle the state update automatically via 'order_updated'
  } catch (err) {
    console.error("Mark successful error:", err);
    alert(err.message);
  }
};
// Mark order as unsuccessful
const handleMarkUnsuccessful = async (order, reason = "") => {
  if (!order._id) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/update_delivery_status/${order._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "unsuccessful", reason }),
    });

    const data = await res.json();

    // Change this line: Check if the request was successful via HTTP status
    if (!res.ok) throw new Error(data.error || "Failed to update status");

  } catch (err) {
    console.error("Mark unsuccessful error:", err);
    alert(err.message);
  }
};

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    setGlobalLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/delete_order/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      removeOrderFromState(orderId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete order.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const submitNewDelivery = async () => {
  const required = ["pickup", "dropoff", "sender_phone", "receiver_phone", "quantity"];
  for (const r of required) {
    if (!String(newDelivery[r] || "").trim()) {
      return alert(`Please fill ${r.replace("_", " ")}`);
    }
  }

  setGlobalLoading(true);
  try {
    const res = await fetch(`${BACKEND_URL}/api/create_delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDelivery), // send raw data
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.message || "Failed to create delivery");

    closeAddModal();
  } catch (err) {
    console.error(err);
    alert("Failed to create delivery: " + (err.message || err));
  } finally {
    setGlobalLoading(false);
  }
};

    const handleFieldChange = async (orderId, field, value) => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/update_delivery_field/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update field");
    }

    const updatedOrder = await res.json();

    // Update state
    setOrders((prev) =>
      prev.map((o) => (String(o._id) === String(orderId) ? updatedOrder : o))
    );
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


const handleDriverAssign = async (orderId, driverId) => {
  try {
    if (!driverId) {
      alert("Please select a driver.");
      return;
    }

    console.log("Assigning driver:", driverId, "to order:", orderId);

    const res = await fetch(
      `${BACKEND_URL}/api/assign_driver/${orderId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      }
    );

    // 🔒 Handle non-JSON responses safely
    if (!res.ok) {
      const text = await res.text();
      console.error("Assign driver failed:", text);
      throw new Error(`Assign failed (${res.status})`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Assign failed");
    }

    console.log("Driver assigned:", data);

    // ❗ DO NOT manually update state
    // Socket.IO 'order_updated' will handle it

  } catch (err) {
    console.error("handleDriverAssign failed:", err);
    alert(err.message);
  }
};




    const submitUnsuccessful = () => {
    const { orderId, reason } = unsuccessfulModal;
    if (!orderId) return alert("Invalid order");

    handleMarkUnsuccessful(
        orders.find((o) => String(o._id) === String(orderId)),
        reason
    );

    closeUnsuccessfulModal();
    };


    const handleSendSMS = async (order) => {
  setGlobalLoading(true);
  try {
    const res = await fetch(`${BACKEND_URL}/api/send_sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_id: order._id, // ✅ must be 'delivery_id'
        sender_phone: order.sender_phone,
        receiver_phone: order.receiver_phone,
        message: `Your delivery order is confirmed. Pickup: ${order.pickup}, Dropoff: ${order.dropoff}, Price: ${order.price}`
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || "Failed to send SMS");
    alert("SMS sent successfully!");
  } catch (err) {
    console.error("SMS send failed:", err);
    alert("Failed to send SMS: " + (err.message || err));
  } finally {
    setGlobalLoading(false);
  }
};



    const [notifyingIds, setNotifyingIds] = useState([]);


const handleNotifyDriver = async (deliveryId, driverId) => {
  // Use environment variable if available (Vite style), otherwise fallback to local
  const API_URL = "https://backend-production-4394.up.railway.app/";

  try {
    const response = await fetch(`${API_URL}/api/notify_driver_app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: deliveryId, driver_id: driverId }),
    });

    const data = await response.json();
    if (data.success) {
      alert("✅ Notification sent to Python Backend!");
    } else {
      alert("⚠️ Server error: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Failed to notify app", err);
    alert("Could not connect to the Dashboard Backend.");
  }
};

  // --- Render
  return (
    <div className="page">
      {globalLoading && (
        <div className="global-spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <div className="header">📦 Tolo Delivery Dashboard</div>
      <div className="main-content">
        {/* Tabs + Add Delivery */}
        <div className="tabs-row">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tab active" : "tab"}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
              >
                {tab}{" "}
                <span className={`tab-count ${tab.toLowerCase()}`}>
                  {tab === "Pending"
                    ? orders.filter((o) => !o.status || o.status === "pending").length
                    : orders.filter((o) => o.status?.toLowerCase() === tab.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>

          <div className="add-delivery">
            <button className="btn primary" onClick={openAddModal}>
              + Add Delivery
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="table">
        <thead>
            <tr>
            <th>Source</th>
            <th>Username</th>
            <th>Pickup</th>
            <th>Dropoff</th>
            <th>Sender</th>
            <th>Receiver</th>
            <th>Location</th>
            <th>Quantity</th>
            <th>Item</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Payment</th>
            <th>Delivery Type</th>
            <th>Driver</th>
            <th>Price</th>
            <th>Timestamp</th>
            <th>Assign</th>
            <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {loading ? (
                <tr>
                <td colSpan="17" className="center">
                    Loading...
                </td>
                </tr>
            ) : paginated.length === 0 ? (
                <tr>
                <td colSpan="17" className="center">
                    No deliveries found.
                </td>
                </tr>
            ) : (
                paginated.map((o) => {
                const rowClass =
                    o.status?.toLowerCase() === "successful"
                    ? "row-success"
                    : o.status?.toLowerCase() === "unsuccessful"
                    ? "row-fail"
                    : "row-pending";

                const assignedDriverName =
                    o.assigned_driver_name ||
                    (o.assigned_driver_id &&
                    drivers.find((d) => String(d._id) === String(o.assigned_driver_id))?.name) ||
                    "-";

                const canAssign = o.price && o.delivery_type && o.assigned_driver_id;

                

                return (
                    <tr key={o._id} className={rowClass}>
                    <td>{o.source || "-"}</td>
                    <td>{o.user_name || o.username || "N/A"}</td>
                    <td>{o.pickup || "-"}</td>
                    <td>{o.dropoff || "-"}</td>
                    <td>{o.sender_phone || "-"}</td>
                    <td>{o.receiver_phone || "-"}</td>
                    <td>{o.full_address || "-"}</td>
                    <td>{o.quantity || "-"}</td>
                    <td>{o.item_description || "-"}</td>
                    <td>{o.status || "pending"}</td>
                    {/* --- REASON COLUMN --- */}
                    <td className="reason-cell">
                      {o.status?.toLowerCase() === "unsuccessful" ? (
                        <span className="reason-text" title={o.reason}>
                          {o.reason || "No reason provided"}
                        </span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td>{o.payment_from_sender_or_receiver || "-"}</td>
                    <td>{o.delivery_type || "-"}</td>
                    <td>{assignedDriverName}</td>
                    <td>{o.price || "-"}</td>
                    <td>{o.timestamp || o.created_at || "-"}</td>

                    <td className="assign-box">
                        {/* Price */}
                        <select
                        value={o.price || ""}
                        onChange={(e) => handleFieldChange(o._id, "price", Number(e.target.value))}
                        >
                                

                        <option value="">Price</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={300}>300</option>
                        </select>


                        {/* Delivery Type */}
                        <select
                        value={o.delivery_type || ""}
                        onChange={(e) => handleFieldChange(o._id, "delivery_type", e.target.value)}
                        >

                        <option value="">Delivery Type</option>
                        <option value="Payable">Payable</option>
                        <option value="Free">Free</option>
                        </select>


                        {/* Driver */}
                        <select
                          value={o.assigned_driver_id ? String(o.assigned_driver_id) : ""}
                          disabled={!o.price || !o.delivery_type}
                          onChange={(e) => handleDriverAssign(String(o._id), e.target.value)}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((d) => (
                            <option key={d._id} value={String(d._id)}>
                              {d.name}
                            </option>
                          ))}
                        </select>

                    </td>

                    <td className="action-col">
                    <button
                        className="success-btn"
                        onClick={() => handleMarkSuccessful(o)}
                        disabled={o.status === "successful"}
                        title="Mark successful"
                    >
                        ✅
                    </button>

                    <button
                        className="fail-btn"
                        onClick={() => openUnsuccessfulModal(o._id)}
                        disabled={o.status === "unsuccessful"}
                        title="Mark unsuccessful"
                    >
                        ❌
                    </button>

                     <button
                      className="send-driver-btn"
                      onClick={() => handleNotifyDriver(o._id, o.assigned_driver_id)}
                      disabled={!o.assigned_driver_id || notifyingIds.includes(o._id)}
                    >
                      {notifyingIds.includes(o._id) ? "Sending..." : "🚗 Notify Driver"}
                    </button>

                    <button className="delete-btn" onClick={() => handleDelete(o._id)} title="Delete Order">
                        🗑
                    </button>

                    <button
                      className="send-txt-btn"
                      onClick={() => handleSendSMS(o)}
                      title="Send SMS"
                      disabled={globalLoading} // disables button while sending
                    >
                      {globalLoading ? "📤 Sending..." : "📩 SMS"} 
                    </button>

                    </td>

                    </tr>
                );
                })
            )}
        </tbody>


        </table>

        {/* Pagination */}
        <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>« First</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹ Prev</button>

            {/* Show only 2 pages: current and next */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === currentPage || page === currentPage + 1)
                .map(page => (
                <button
                    key={page}
                    className={page === currentPage ? "active-page" : ""}
                    onClick={() => setCurrentPage(page)}
                >
                    {page}
                </button>
                ))
            }

            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next ›</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last »</button>
        </div>


      </div>

      <div className="footer">© 2025 Tolo Delivery</div>

      {/* Unsuccessful Modal */}
      {unsuccessfulModal.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Mark Delivery Unsuccessful</h3>
            <textarea
              placeholder="Enter reason..."
              value={unsuccessfulModal.reason}
              onChange={(e) =>
                setUnsuccessfulModal((p) => ({ ...p, reason: e.target.value }))
              }
            />
            <div className="modal-actions">
              <button onClick={submitUnsuccessful} className="btn primary">
                Submit
              </button>
              <button onClick={closeUnsuccessfulModal} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Delivery Modal */}
      {addModalOpen && (
        <div className="modal-overlay" ref={modalOverlayRef} onMouseDown={onOverlayClick}>
          <div className="modal-card large" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Add Delivery</h3>
            <div className="form-grid">
              {/* Form Fields */}
              {Object.entries(newDelivery).map(([field, value]) => (
                <label key={field} className={field === "full_address" || field === "item_description" ? "full" : ""}>
                  {field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  {field === "source" || field === "payment_from_sender_or_receiver" || field === "delivery_type" ? (
                    <select value={value} onChange={(e) => handleNewDeliveryChange(field, e.target.value)}>
                      {field === "source" && (
                        <>
                          <option value="web">web</option>
                          <option value="bot">bot</option>
                          <option value="unknown">unknown</option>
                        </>
                      )}
                      {field === "payment_from_sender_or_receiver" && (
                        <>
                          <option value="sender">sender</option>
                          <option value="receiver">receiver</option>
                        </>
                      )}
                      {field === "delivery_type" && (
                        <>
                          <option value="Payable">Payable</option>
                          <option value="Free">Free</option>
                        </>
                      )}
                    </select>
                  ) : field === "item_description" || field === "full_address" ? (
                    <textarea value={value} onChange={(e) => handleNewDeliveryChange(field, e.target.value)} />
                  ) : (
                    <input
                      type={field === "quantity" ? "number" : "text"}
                      min={field === "quantity" ? 1 : undefined}
                      value={value}
                      onChange={(e) => handleNewDeliveryChange(field, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
              onClick={submitNewDelivery}
              className="btn primary"
              disabled={
                !newDelivery.pickup.trim() ||
                !newDelivery.dropoff.trim() ||
                !newDelivery.sender_phone.trim() ||
                !newDelivery.receiver_phone.trim() ||
                !newDelivery.quantity
              }
            >
              Add Delivery
            </button>

              <button onClick={closeAddModal} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
