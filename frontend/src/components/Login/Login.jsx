import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import logo from "../../assets/logo.png"; // Adjust the path as needed

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      if (response.status === 200) {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("role", response.data.role);

        if (response.data.role === "Admin") {
          navigate("/admin-dashboard");
        } else if (response.data.role === "Manager") {
          navigate("/manager-dashboard");
        } else {
          setError("Unauthorized access");
        }
      }
    } catch (err) {
      setError("Login failed! Please check your username and password.");
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="RAM Medical Logo" />
      <h2>Welcome to RAM Medical</h2>
      <h3>Please login to continue</h3>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;