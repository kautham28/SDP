import React, { useState, useEffect } from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import MButton from "../../components/Manager/MButton";
import MDropdown from "../../components/Manager/MDropdown";
import { Eye, Trash2, Check } from "lucide-react";
import Swal from "sweetalert2";
import "./MAssignRoles.css";

const MAssignRoles = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [userName, setUserName] = useState("");
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

  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((response) => response.json())
      .then((data) => {
        setAssignedUsers(data);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const handleAssignRole = () => {
    if (userName && selectedRole) {
      setAssignedUsers([...assignedUsers, { username: userName, role: selectedRole }]);
      setUserName("");
      setSelectedRole("");
    } else {
      alert("Please enter a name and select a role.");
    }
  };

  const handleShowModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleAddUserModal = () => {
    setShowAddUserModal(true);
  };

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

  const handleAddNewUser = async () => {
    const { username, password, role, email, phone_number, address, ic_number, date_of_birth } = newUser;
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
        setError(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError("An error occurred while adding the user");
    }
  };

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
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating the status");
    }
  };

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
                {selectedUser.photo && (
                  <div className="m-user-photo">
                    <strong>Photo:</strong>
                    <img
                      src={`data:image/jpeg;base64,${selectedUser.photo}`}
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
                  <p className="m-error-message" style={{ color: "red" }}>
                    {error}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newUser.phone_number}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone_number: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newUser.address}
                  onChange={(e) =>
                    setNewUser({ ...newUser, address: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="text"
                  placeholder="IC Number"
                  value={newUser.ic_number}
                  onChange={(e) =>
                    setNewUser({ ...newUser, ic_number: e.target.value })
                  }
                  className="m-input-field"
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={newUser.date_of_birth}
                  onChange={(e) =>
                    setNewUser({ ...newUser, date_of_birth: e.target.value })
                  }
                  className="m-input-field"
                />
                <MDropdown
                  options={["Admin", "Manager", "Rep"]}
                  selectedValue={newUser.role}
                  onSelect={(role) => setNewUser({ ...newUser, role })}
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