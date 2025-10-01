import "./Login.css";
import { FaLock } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import { useState } from "react";
import { login } from "../../services/auth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Introduce un correo electrónico válido");
      return;
    }
    try {
      const data = await login(email, password);
      localStorage.setItem("authToken", data.token);
      console.log(data.user);
      localStorage.setItem("userData", JSON.stringify(data.user));
      navigate(`/main`);
    } catch (error) {
      console.error("Error en el login:", error.message);
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="container-principal">
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          <div className="input-box">
            <input
              type="text"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setUsername(e.target.value)}
            />
            <IoMail className="icon" />
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FaLock className="icon" />
          </div>
          <button type="submit">Login</button>
          <div className="register-link"> 
            <p>
              No tienes una cuenta? <Link to="/register">Regístrate</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
