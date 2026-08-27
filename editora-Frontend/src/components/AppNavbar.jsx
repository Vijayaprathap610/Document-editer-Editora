import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const AppNavbar = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Navbar
      expand="lg"
      bg="white"
      className="app-navbar border-bottom"
      sticky="top"
    >
      <Container fluid="lg">
        <Navbar.Brand as={Link} to="/dashboard" className="brand">
          <span className="brand-mark">E</span>

          <span>Editora</span>
        </Navbar.Brand>

        <Navbar.Toggle />

        <Navbar.Collapse>
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link as={Link} to="/dashboard">
              Dashboard
            </Nav.Link>

            <Dropdown className="ms-lg-3">
              <Dropdown.Toggle variant="light" className="user-dropdown">
                <span className="avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>

                <span className="d-none d-sm-inline">{user?.name}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Header>{user?.email}</Dropdown.Header>

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleLogout}>Log out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
