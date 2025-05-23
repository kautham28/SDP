import React, { useState, useEffect } from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import MButton from "../../components/Manager/MButton";
import MDropdown from "../../components/Manager/MDropdown";
import { Eye, Trash2, Check } from "lucide-react";
import Swal from "sweetalert2";
import "./MAssignRoles.css";

const MAssignRoles = () => {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "",
    email: "",
    phone_number: "",
    address: "",
    ic_number: "",
    date_of_birth: "",
  });
  const [error, setError] = useState("");

  // Fetch users on component mount
  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((response) => response.json())
      .then((data) => {
        setAssignedUsers(data);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  // Show user details modal
  const handleShowModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Close user details modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Show add user modal
  const handleAddUserModal = () => {
    setShowAddUserModal(true);
  };

  // Close add user modal and reset form
  const handleCloseAddUserModal = () => {
    setShowAddUserModal(false);
    setError("");
    setNewUser({
      username: "",
      password: "",
      role: "",
      email: "",
      phone_number: "",
      address: "",
      ic_number: "",
      date_of_birth: "",
    });
  };

  // Add new user to the system
  const handleAddNewUser = async () => {
    const { username, password, role, email, phone_number, address, ic_number, date_of_birth } = newUser;

    // Username: only letters
    if (!/^[A-Za-z]+$/.test(username)) {
      setError("Username must contain only letters");
      return;
    }
    // Password: accept all characters (no validation)

    // Email: must contain @
    if (!/^.+@.+\..+$/.test(email)) {
      setError("Invalid email address");
      return;
    }
    // Phone number: exactly 10 digits
    if (!/^\d{10}$/.test(phone_number)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    // Address: allow numbers and letters (spaces allowed)
    if (!/^[A-Za-z0-9\s]+$/.test(address)) {
      setError("Address can only contain letters, numbers, and spaces");
      return;
    }
    // IC number: all digits, or all digits except last is letter
    if (!/^\d+$/.test(ic_number) && !/^\d+[A-Za-z]$/.test(ic_number)) {
      setError("IC Number must be all digits or digits with last character as a letter");
      return;
    }
    if (!username || !password || !role || !email || !phone_number || !address || !ic_number || !date_of_birth) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/users/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newUser, status: "working" }),
      });

      const data = await response.json();

      if (response.ok) {
        setAssignedUsers([...assignedUsers, { ...newUser, id: data.userId, status: "working" }]);
        setShowAddUserModal(false);
        setError("");
        setNewUser({
          username: "",
          password: "",
          role: "",
          email: "",
          phone_number: "",
          address: "",
          ic_number: "",
          date_of_birth: "",
        });
        alert("User added successfully!");
      } else {
        console.error("Add user failed:", data, response.status, response.statusText);
        setError(data.message || `Failed to add user: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError(`An error occurred while adding the user: ${error.message}`);
    }
  };

  // Update user status
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAssignedUsers(
          assignedUsers.map((user) =>
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
        alert(`User status updated to ${newStatus}`);
      } else {
        const data = await response.json();
        alert(data.message || `Failed to update status: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`An error occurred while updating the status: ${error.message}`);
    }
  };

  // Terminate user with confirmation
  const handleTerminateUser = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusChange(user.id, "terminated");
        Swal.fire({
          title: "Deleted!",
          text: "User has been terminated.",
          icon: "success"
        });
      }
    });
  };

  // Rejoin user with confirmation
  const handleRejoinUser = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to rejoin this person?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, rejoin!"
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusChange(user.id, "working");
        Swal.fire({
          title: "Rejoined!",
          text: "User has been rejoined.",
          icon: "success"
        });
      }
    });
  };

  return (
    <div className="m-assign-roles-container">
      <MNavbar />
      <div className="m-assign-roles-content">
        <MSidebar />
        <div className="m-assign-roles-main">
          <h1>Assign Roles</h1>
          <p>Assign roles to team members.</p>
          <MButton label="Add New User" onClick={handleAddUserModal} variant="primary" />
          <h3>Assigned Users</h3>
          <table className="m-assign-role-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.username}</td>
                  <td>{user.role || "Not Assigned"}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number}</td>
                  <td>{user.status}</td>
                  <td>
                    <Eye
                      onClick={() => handleShowModal(user)}
                      className="m-eye-icon"
                      style={{ cursor: "pointer", color: "blue", marginRight: "10px" }}
                    />
                    {user.status === "working" ? (
                      <Trash2
                        onClick={() => handleTerminateUser(user)}
                        className="m-trash-icon"
                        style={{ marginLeft: "5px" }}
                      />
                    ) : (
                      <Check
                        onClick={() => handleRejoinUser(user)}
                        className="m-rejoin-icon"
                        style={{ marginLeft: "5px", color: "#28a745", cursor: "pointer", fontSize: 20 }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showModal && selectedUser && (
            <div className="m-modal">
              <div className="m-modal-content">
                <button className="m-close" onClick={handleCloseModal}>
                  X
                </button>
                <h2>User Details</h2>
                <table className="m-user-details-table">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Username:</strong>
                      </td>
                      <td>{selectedUser.username}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Email:</strong>
                      </td>
                      <td>{selectedUser.email}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Phone:</strong>
                      </td>
                      <td>{selectedUser.phone_number}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Address:</strong>
                      </td>
                      <td>{selectedUser.address}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Role:</strong>
                      </td>
                      <td>{selectedUser.role}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>IC Number:</strong>
                      </td>
                      <td>{selectedUser.ic_number}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Date of Birth:</strong>
                      </td>
                      <td>{selectedUser.date_of_birth}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Status:</strong>
                      </td>
                      <td>{selectedUser.status}</td>
                    </tr>
                  </tbody>
                </table>
                {selectedUser.photo_link && (
                  <div className="m-user-photo">
                    <strong>Photo:</strong>
                    <img
                      src={`data:image/jpeg;base64,${selectedUser.photo_link}`}
                      alt="User Photo"
                      style={{ width: "100px", height: "100px", marginTop: "10px" }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {showAddUserModal && (
            <div className="m-modal">
              <div className="m-modal-content">
                <button className="m-close" onClick={handleCloseAddUserModal}>
                  X
                </button>
                <h2>Add New User</h2>
                {error && (
                  <p className="m-error-message" style={{ color: "red", marginBottom: 8 }}>
                    {error}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewUser({ ...newUser, username: value });
                    if (!/^[A-Za-z]*$/.test(value)) {
                      setError("Username must contain only letters");
                    } else {
                      setError("");
                    }
                  }}
                  className="m-input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="m-input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewUser({ ...newUser, email: value });
                    if (value && !/^.+@.+\..+$/.test(value)) {
                      setError("Invalid email address");
                    } else {
                      setError("");
                    }
                  }}
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newUser.phone_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewUser({ ...newUser, phone_number: value });
                    if (value && !/^\d{0,10}$/.test(value)) {
                      setError("Phone number must be up to 10 digits");
                    } else if (value.length === 10 && !/^\d{10}$/.test(value)) {
                      setError("Phone number must be exactly 10 digits");
                    } else {
                      setError("");
                    }
                  }}
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newUser.address}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewUser({ ...newUser, address: value });
                    if (value && !/^[A-Za-z0-9\s]*$/.test(value)) {
                      setError("Address can only contain letters, numbers, and spaces");
                    } else {
                      setError("");
                    }
                  }}
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="IC Number"
                  value={newUser.ic_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewUser({ ...newUser, ic_number: value });
                    if (value && !/^\d*$/.test(value) && !/^\d+[A-Za-z]$/.test(value)) {
                      setError("IC Number must be all digits or digits with last character as a letter");
                    } else {
                      setError("");
                    }
                  }}
                  className="m-input-field"
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={newUser.date_of_birth}
                  onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                  className="m-input-field"
                />
                <label htmlFor="role-dropdown" className="m-input-label">
                  Roles
                </label>
                <MDropdown
                  id="role-dropdown"
                  options={["Admin", "Manager", "Rep"]}
                  selectedValue={newUser.role}
                  onSelect={(role) => setNewUser({ ...newUser, role })}
                  placeholder="Select a role"
                />
                <MButton
                  label="Add User"
                  onClick={handleAddNewUser}
                  variant="primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MAssignRoles;