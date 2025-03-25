import React, { useState, useEffect } from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import MButton from "../../components/Manager/MButton";
import MDropdown from "../../components/Manager/MDropdown";
import { Eye } from "lucide-react"; // Import Eye icon from lucide-react
import "./MAssignRoles.css";

const MAssignRoles = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [userName, setUserName] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((response) => response.json())
      .then((data) => {
        setAssignedUsers(data); // Set fetched users to assignedUsers
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  // Handle role assignment (only local state update for now)
  const handleAssignRole = () => {
    if (userName && selectedRole) {
      setAssignedUsers([...assignedUsers, { username: userName, role: selectedRole }]);
      setUserName("");
      setSelectedRole("");
    } else {
      alert("Please enter a name and select a role.");
    }
  };

  // Show modal with user details
  const handleShowModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Hide modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="assign-roles-container">
      <MNavbar />
      <div className="assign-roles-content">
        <MSidebar />
        <div className="assign-roles-main">
          <h1>Assign Roles</h1>
          <p>Assign roles to team members.</p>

          {/* Add Role Section */}
          <div className="assign-role-form">
            <input
              type="text"
              placeholder="Enter Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="assign-input"
            />
            <MDropdown
              options={["Admin", "Manager"]}
              selectedValue={selectedRole}
              onSelect={setSelectedRole}
            />
            <MButton
              label="Assign Role"
              onClick={handleAssignRole}
              variant="primary"
              disabled={!userName || !selectedRole}
            />
          </div>

          {/* Assigned Users Table */}
          <h3>Assigned Users</h3>
          <table className="assign-role-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.username}</td>
                  <td>{user.role || "Not Assigned"}</td>
                  <td>{user.phone_number}</td>
                  <td>
                    <Eye
                      onClick={() => handleShowModal(user)}
                      className="eye-icon"
                      style={{ cursor: "pointer", color: "blue" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal for User Details */}
          {showModal && selectedUser && (
            <div className="modal">
              <div className="modal-content">
                {/* Close Button inside Modal Box */}
                <button className="close" onClick={handleCloseModal}>
                  X
                </button>

                <h2>User Details</h2>

                {/* Table for User Details */}
                <table className="user-details-table">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{selectedUser.username}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{selectedUser.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Phone:</strong></td>
                      <td>{selectedUser.phone_number}</td>
                    </tr>
                    <tr>
                      <td><strong>Address:</strong></td>
                      <td>{selectedUser.address}</td>
                    </tr>
                    <tr>
                      <td><strong>Role:</strong></td>
                      <td>{selectedUser.role}</td>
                    </tr>
                    <tr>
                      <td><strong>IC Number:</strong></td>
                      <td>{selectedUser.ic_number}</td>
                    </tr>
                    <tr>
                      <td><strong>Date of Birth:</strong></td>
                      <td>{selectedUser.date_of_birth}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Display User Photo */}
                {selectedUser.photo && (
                  <div className="user-photo">
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
        </div>
      </div>
    </div>
  );
};

export default MAssignRoles;
