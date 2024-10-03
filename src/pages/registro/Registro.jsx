import "./Registro.css";
import { FaUser, FaLock } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import { useState } from "react";
import { register } from "../../services/auth";
import { useNavigate, Link } from "react-router-dom";

function Registro() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setError("");
      const data = await register(email, username, password);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.usuario));

      navigate(`/inicio`);
    } catch (error) {
      console.error("Error en el registro:", error.message);
    }
  };

  return (
    <div className="container-principal">
      <div className="wrapper">
        <form onSubmit={handleSubmit}>
          <h1>Registro</h1>
          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <IoMail className="icon" />
          </div>
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <FaUser className="icon" />
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
          <div className="input-box">
            <input
              type="password"
              placeholder="Confirmar Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <FaLock className="icon" />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Registro</button>
          <div className="register-link">
            <p>
              Ya tienes una cuenta? <Link to="/">Ingresa</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;
