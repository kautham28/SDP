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
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      console.log("Full Response:", response);

      if (response.status === 200) {
        const { token, userID, role } = response.data;

        if (!token || !userID || !role) {
          console.error("Missing token, userID, or role in response", response.data);
          setError("Invalid response from server.");
          return;
        }

        // Store login data in sessionStorage
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userID", userID);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("isLoggedIn", true);

        // Redirect based on role
        if (role === "Admin") {
          console.log("Navigating to Admin Dashboard");
          navigate("/admin-dashboard");
        } else if (role === "Manager") {
          console.log("Navigating to Manager Dashboard");
          navigate("/manager/dashboard");
        } else if (role === "Rep") {
          console.log("Navigating to Rep Dashboard");
          navigate("/rep/dashboard");
        } else {
          setError("Unauthorized access");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.response ? err.response.data : err.message);
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to the server. Please check if the server is running or contact support.");
      } else {
        setError(
          err.response?.data?.message || "Login failed! Please check your username and password."
        );
      }
    }
  };

  return (
    <section className="login-section">
      {/* Medical Quote Section */}
      <div className="quote-container">
        <p className="quote-text">
          "Wherever the art of medicine is loved, there is also a love of humanity."
        </p>
        <p className="quote-writer">- Hippocrates</p>
        <p className="quote-meaning">
          This quote highlights the deep connection between medicine and compassion. It suggests that true medical practice is not just about knowledge and treatment but also about empathy and care for people.
        </p>
      </div>

      {/* Login Form Section */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-image"></div>
          <div className="login-content">
            <form onSubmit={handleLogin}>
              <div className="login-header">
                <img src={logo} alt="RAM Medical Logo" className="login-logo" />
                <h2>Welcome to RAM Medical</h2>
                <h3>Please login to continue</h3>
              </div>
              <div className="login-input">
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="login-input">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              <div className="login-footer">
                <button type="submit" className="login-button">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;