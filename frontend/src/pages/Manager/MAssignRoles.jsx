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

  // Handle opening the add new user modal
  const handleAddUserModal = () => {
    setShowAddUserModal(true);
  };

  // Handle closing the add new user modal
  const handleCloseAddUserModal = () => {
    setShowAddUserModal(false);
  };

  // Handle adding a new user
  const handleAddNewUser = () => {
    // You can handle API call here to add the new user
    const newUserData = { ...newUser };
    console.log(newUserData);
    setAssignedUsers([...assignedUsers, newUserData]); // Just adding the new user to local state for now
    setShowAddUserModal(false);
  };

  return (
    <div className="assign-roles-container">
      <MNavbar />
      <div className="assign-roles-content">
        <MSidebar />
        <div className="assign-roles-main">
          <h1>Assign Roles</h1>
          <p>Assign roles to team members.</p>

          {/* Add New User Button */}
          <MButton
            label="Add New User"
            onClick={handleAddUserModal}
            variant="primary"
          />

          {/* Assigned Users Table */}
          <h3>Assigned Users</h3>
          <table className="assign-role-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone Number</th>
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
                <button className="close" onClick={handleCloseModal}>X</button>
                <h2>User Details</h2>
                <table className="user-details-table">
                  <tbody>
                    <tr>
                      <td><strong>Username:</strong></td>
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

          {/* Modal for Adding New User */}
          {showAddUserModal && (
            <div className="modal">
              <div className="modal-content">
                <button className="close" onClick={handleCloseAddUserModal}>X</button>
                <h2>Add New User</h2>
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="IC Number"
                  value={newUser.ic_number}
                  onChange={(e) => setNewUser({ ...newUser, ic_number: e.target.value })}
                  className="input-field"
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={newUser.date_of_birth}
                  onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                  className="input-field"
                />
                <MDropdown
                  options={["Admin", "Manager"]}
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
