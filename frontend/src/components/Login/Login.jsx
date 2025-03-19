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
          navigate("/manager/dashboard");
        } else {
          setError("Unauthorized access");
        }
      }
    } catch (err) {
      setError("Login failed! Please check your username and password.");
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
        This quote highlights the deep connection between medicine and compassion. It suggests that true medical practice is not just about knowledge and treatment but also about empathy and care for people. A great healthcare provider not only heals physically but also supports patients emotionally and mentally.
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
