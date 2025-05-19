import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import logo from "../../assets/logo.png"; // Adjust the path as needed

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
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

  const handleForgot = async () => {
    setForgotMsg("");
    try {
      await axios.post("http://localhost:5000/api/forgot-password/request-otp", { email: forgotEmail });
      setOtpSent(true);
      setForgotMsg("OTP sent to your email");
    } catch (err) {
      setForgotMsg(err.response?.data?.error || "Error sending OTP");
    }
  };

  const handleReset = async () => {
    setForgotMsg("");
    setConfirmError("");
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/forgot-password/verify-otp", { email: forgotEmail, otp, newPassword });
      setForgotMsg("Password reset successful. You can now log in.");
      setShowForgot(false);
      setOtpSent(false);
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setForgotMsg(err.response?.data?.error || "Error resetting password");
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.2rem' }}
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="login-footer">
                <button type="submit" className="login-button">Login</button>
                <button type="button" className="login-forgot" onClick={() => setShowForgot(true)} style={{marginLeft:'10px',background:'none',color:'#007bff',border:'none',cursor:'pointer',textDecoration:'underline'}}>Forgot Password?</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showForgot && (
        <div className="forgot-modal" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',padding:'2rem',borderRadius:'8px',minWidth:'320px',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
            <h3>Forgot Password</h3>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              style={{width:'100%',marginBottom:'1rem',padding:'0.5rem'}}
            />
            {!otpSent ? (
              <button onClick={handleForgot} style={{width:'100%',marginBottom:'1rem'}}>Send OTP</button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  style={{width:'100%',marginBottom:'1rem',padding:'0.5rem'}}
                />
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{width:'100%',padding:'0.5rem',paddingRight:'2.2rem'}}
                  />
                  <span
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{width:'100%',padding:'0.5rem',paddingRight:'2.2rem'}}
                  />
                  <span
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {confirmError && <div style={{color:'red',marginBottom:'1rem'}}>{confirmError}</div>}
                <button onClick={handleReset} style={{width:'100%',marginBottom:'1rem'}}>Reset Password</button>
              </>
            )}
            <button onClick={() => {setShowForgot(false);setOtpSent(false);setForgotMsg("");setConfirmError("");}} style={{width:'100%'}}>Cancel</button>
            <div style={{marginTop:'1rem',color: forgotMsg.includes('successful') ? 'green' : 'red'}}>{forgotMsg}</div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Login;