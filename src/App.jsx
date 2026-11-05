import { useEffect, useMemo, useState } from "react";
import {
  HeartHandshake, Utensils, ShieldCheck, LogOut, PlusCircle,
  CheckCircle2, XCircle, PackageCheck, Users, Clock3, MapPin,
  Phone, RefreshCw, Leaf, LayoutDashboard
} from "lucide-react";
import {
  readUsers, saveUsers, readFoods, saveFoods, readSession,
  saveSession, clearSession, seedDemoData, ADMIN_USERNAME, ADMIN_PASSWORD
} from "./utils/storage";

const blankFood = {
  foodName: "", quantity: "", phone: "", location: "", expiry: ""
};

export default function App() {
  const [session, setSession] = useState(readSession());
  const [users, setUsers] = useState(readUsers());
  const [foods, setFoods] = useState(readFoods());
  const [page, setPage] = useState(readSession() ? "dashboard" : "home");
  const [authMode, setAuthMode] = useState("login");
  const [role, setRole] = useState("Donor");
  const [notice, setNotice] = useState("");
  const [auth, setAuth] = useState({ name: "", email: "", password: "", phone: "", location: "" });
  const [adminAuth, setAdminAuth] = useState({ username: "", password: "" });
  const [food, setFood] = useState(blankFood);
  const [recipient, setRecipient] = useState({ name: "", phone: "", location: "" });

  useEffect(() => { seedDemoData(); }, []);

  const refresh = () => {
    setUsers(readUsers());
    setFoods(readFoods());
  };

  const message = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const navigate = (next) => { setPage(next); setNotice(""); };

  function signup(e) {
    e.preventDefault();
    const cleanEmail = auth.email.trim().toLowerCase();
    if (!auth.name.trim() || !cleanEmail || !auth.password || auth.password.length < 6) {
      message("Enter all required details. Password must be at least 6 characters.");
      return;
    }
    const current = readUsers();
    if (current.some((u) => u.email === cleanEmail)) {
      message("An account with this email already exists.");
      return;
    }
    const newUser = {
      id: crypto.randomUUID(), name: auth.name.trim(), email: cleanEmail,
      password: auth.password, role, phone: auth.phone.trim(), location: auth.location.trim()
    };
    saveUsers([...current, newUser]);
    saveSession({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, location: newUser.location });
    setSession(readSession());
    refresh();
    setAuth({ name: "", email: "", password: "", phone: "", location: "" });
    navigate("dashboard");
    message("Account created successfully!");
  }

  function login(e) {
    e.preventDefault();
    const email = auth.email.trim().toLowerCase();
    const found = readUsers().find((u) => u.email === email && u.password === auth.password && u.role === role);
    if (!found) { message("Invalid email, password, or selected account type."); return; }
    const active = { id: found.id, name: found.name, email: found.email, role: found.role, phone: found.phone, location: found.location };
    saveSession(active);
    setSession(active);
    navigate("dashboard");
    message("Login successful. Welcome!");
  }

  function adminLogin(e) {
    e.preventDefault();
    if (adminAuth.username === ADMIN_USERNAME && adminAuth.password === ADMIN_PASSWORD) {
      const active = { id: "demo-admin", name: "Administrator", email: "admin@foodshare.demo", role: "Admin" };
      saveSession(active);
      setSession(active);
      navigate("dashboard");
      message("Admin login successful.");
    } else message("Incorrect admin username or password.");
  }

  function logout() {
    clearSession();
    setSession(null);
    setAuth({ name: "", email: "", password: "", phone: "", location: "" });
    navigate("home");
  }

  function submitFood(e) {
    e.preventDefault();
    if (!food.foodName.trim() || !food.quantity.trim() || !food.phone.trim() || !food.location.trim() || !food.expiry) {
      message("Please complete all food details.");
      return;
    }
    const item = {
      id: crypto.randomUUID(), ...food, donorId: session.id, donorName: session.name,
      status: "Pending Admin Verification", claimStatus: "Not Claimed",
      recipient: null, createdAt: new Date().toISOString()
    };
    const updated = [...readFoods(), item];
    saveFoods(updated); setFoods(updated); setFood(blankFood);
    message("Food submitted for admin verification!");
  }

  function updateFood(id, changes) {
    const updated = readFoods().map((item) => item.id === id ? { ...item, ...changes } : item);
    saveFoods(updated); setFoods(updated);
  }

  function claimFood(item) {
    if (!recipient.name.trim() || !recipient.phone.trim() || !recipient.location.trim()) {
      message("Enter recipient name, phone number and location before claiming.");
      return;
    }
    if (item.status !== "Available" || item.claimStatus === "Claimed") {
      message("Sorry, this food is no longer available."); refresh(); return;
    }
    updateFood(item.id, {
      status: "Claimed", claimStatus: "Claimed",
      recipient: { ...recipient, userId: session.id }
    });
    message("Food claimed successfully!");
  }

  const myFoods = useMemo(() => foods.filter((f) => f.donorId === session?.id), [foods, session]);
  const availableFoods = foods.filter((f) => f.status === "Available" && f.claimStatus !== "Claimed");
  const claims = foods.filter((f) => f.claimStatus === "Claimed");
  const stats = [
    { label: "Total food posts", value: foods.length, icon: Utensils },
    { label: "Awaiting verification", value: foods.filter(f => f.status === "Pending Admin Verification").length, icon: Clock3 },
    { label: "Available food", value: availableFoods.length, icon: PackageCheck },
    { label: "Successful claims", value: claims.length, icon: HeartHandshake }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate(session ? "dashboard" : "home")}>
          <span className="brand-icon"><Leaf size={22} /></span>
          <span>Food<span className="brand-light">Share</span><small>Less waste. More care.</small></span>
        </button>
        <nav>
          {session ? <>
            <span className="user-chip">{session.role}: {session.name}</span>
            <button className="btn btn-outline btn-small" onClick={logout}><LogOut size={16}/> Logout</button>
          </> : <>
            <button className="nav-link" onClick={() => { setAuthMode("login"); navigate("auth"); }}>Login</button>
            <button className="btn btn-primary btn-small" onClick={() => { setAuthMode("signup"); navigate("auth"); }}>Sign up</button>
          </>}
        </nav>
      </header>

      {notice && <div className="toast" role="status">{notice}</div>}

      <main>
        {page === "home" && <Home onLogin={() => { setAuthMode("login"); navigate("auth"); }} onSignup={() => { setAuthMode("signup"); navigate("auth"); }} onAdmin={() => navigate("admin")} />}
        {page === "auth" && <AuthPage mode={authMode} setMode={setAuthMode} role={role} setRole={setRole} auth={auth} setAuth={setAuth} onSubmit={authMode === "signup" ? signup : login} onBack={() => navigate("home")} />}
        {page === "admin" && <AdminLogin values={adminAuth} setValues={setAdminAuth} onSubmit={adminLogin} onBack={() => navigate("home")} />}
        {page === "dashboard" && session && <>
          <section className="dashboard-heading">
            <div><p className="eyebrow"><LayoutDashboard size={15}/> {session.role} MODULE</p><h1>Welcome, {session.name.split(" ")[0]}!</h1><p className="muted">Manage food donations and help your community.</p></div>
            <button className="btn btn-outline" onClick={refresh}><RefreshCw size={16}/> Refresh data</button>
          </section>
          {session.role === "Admin" && <AdminDashboard foods={foods} stats={stats} onUpdate={updateFood} />}
          {session.role === "Donor" && <DonorDashboard session={session} food={food} setFood={setFood} onSubmit={submitFood} foods={myFoods} />}
          {session.role === "Recipient" && <RecipientDashboard foods={availableFoods} claims={claims.filter(f => f.recipient?.userId === session.id)} recipient={recipient} setRecipient={setRecipient} onClaim={claimFood} />}
        </>}
      </main>
      <footer>© {new Date().getFullYear()} FoodShare · Community food redistribution</footer>
    </div>
  );
}

function Home({ onLogin, onSignup, onAdmin }) {
  return <><section className="hero">
    <div className="hero-copy"><p className="eyebrow"><HeartHandshake size={16}/> COMMUNITY FOOD NETWORK</p>
      <h1>Good food deserves<br/><span>another chance.</span></h1>
      <p className="hero-text">FoodShare connects people and organizations with surplus food to those who need it. Share more, waste less, and make a difference.</p>
      <div className="hero-actions"><button className="btn btn-primary" onClick={onSignup}>Create an account <span>→</span></button><button className="btn btn-outline" onClick={onLogin}>Login</button></div>
      <div className="hero-note"><ShieldCheck size={17}/> Simple community-powered food sharing</div>
    </div>
    <div className="hero-art"><div className="art-circle"><span>🥗</span></div><div className="floating-card"><HeartHandshake size={19}/><span><b>Share kindness</b><small>One meal at a time</small></span></div></div>
  </section>
  <section className="feature-section"><div className="section-title"><p className="eyebrow">HOW IT WORKS</p><h2>Three steps. Real impact.</h2></div>
    <div className="feature-grid">
      <Feature icon={Utensils} title="Donors share food" text="Post surplus food with quantity, pickup location and expiry details." number="01"/>
      <Feature icon={ShieldCheck} title="Admin verifies" text="The admin reviews submissions and approves safe, suitable food posts." number="02"/>
      <Feature icon={HeartHandshake} title="Recipients claim" text="Recipients browse verified food and claim what they need." number="03"/>
    </div>
  </section>
  <section className="join-banner"><div><h2>Be part of the change.</h2><p>Every shared meal is a step towards a world with less food waste.</p></div><button className="btn btn-white" onClick={onSignup}>Join FoodShare →</button></section>
  <div className="admin-entry"><button className="text-button" onClick={onAdmin}>Administrator access</button></div>
  </>;
}

function Feature({ icon: Icon, title, text, number }) {
  return <article className="feature-card"><div className="feature-top"><span className="feature-icon"><Icon size={22}/></span><span className="feature-number">{number}</span></div><h3>{title}</h3><p>{text}</p></article>;
}

function AuthPage({ mode, setMode, role, setRole, auth, setAuth, onSubmit, onBack }) {
  const change = (key, value) => setAuth(prev => ({ ...prev, [key]: value }));
  return <section className="auth-wrap"><div className="auth-aside"><span className="auth-mark"><Leaf size={28}/></span><p className="eyebrow">WELCOME TO FOODSHARE</p><h2>{mode === "signup" ? "Start sharing good things." : "Good to see you again."}</h2><p>Connect with your community and help make surplus food count.</p></div>
    <div className="auth-card"><button className="back-link" onClick={onBack}>← Back to home</button><h2>{mode === "signup" ? "Create your account" : "Login to FoodShare"}</h2><p className="muted">{mode === "signup" ? "Fill in your details to get started." : "Enter your details to continue."}</p>
      <form onSubmit={onSubmit}>
        <label>Account type</label><div className="role-switch">{["Donor", "Recipient"].map(r => <button type="button" key={r} className={role === r ? "selected" : ""} onClick={() => setRole(r)}>{r}</button>)}</div>
        {mode === "signup" && <><label>Full name</label><input required value={auth.name} onChange={e => change("name", e.target.value)} placeholder="Enter your name"/><label>Phone number</label><input required value={auth.phone} onChange={e => change("phone", e.target.value)} placeholder="Enter phone number"/><label>Location</label><input required value={auth.location} onChange={e => change("location", e.target.value)} placeholder="Your area or city"/></>}
        <label>Email address</label><input type="email" required value={auth.email} onChange={e => change("email", e.target.value)} placeholder="you@example.com"/>
        <label>Password</label><input type="password" minLength="6" required value={auth.password} onChange={e => change("password", e.target.value)} placeholder="At least 6 characters"/>
        <button className="btn btn-primary full-btn" type="submit">{mode === "signup" ? "Create account" : "Login"} →</button>
      </form>
      <p className="switch-auth">{mode === "signup" ? "Already registered?" : "New to FoodShare?"} <button onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Login" : "Create account"}</button></p>
    </div></section>;
}

function AdminLogin({ values, setValues, onSubmit, onBack }) {
  return <section className="admin-login"><div className="admin-login-icon"><ShieldCheck size={30}/></div><button className="back-link" onClick={onBack}>← Back to home</button><h2>Administrator login</h2><p className="muted">Sign in to review food submissions and claims.</p>
    <form onSubmit={onSubmit}><label>Username</label><input required value={values.username} onChange={e => setValues(v => ({...v, username:e.target.value}))} placeholder="Admin username"/><label>Password</label><input type="password" required value={values.password} onChange={e => setValues(v => ({...v, password:e.target.value}))} placeholder="Admin password"/><button className="btn btn-primary full-btn">Login as admin →</button></form>
    <p className="demo-hint">Demo: <b>admin</b> / <b>Admin@123</b></p>
  </section>;
}

function DashboardStats({ stats }) {
  return <div className="stats-grid">{stats.map(({label,value,icon:Icon}) => <div className="stat-card" key={label}><span><Icon size={19}/></span><div><strong>{value}</strong><small>{label}</small></div></div>)}</div>;
}

function AdminDashboard({ foods, stats, onUpdate }) {
  const [filter, setFilter] = useState("All");
  const shown = foods.filter(f => filter === "All" || f.status === filter);
  return <><DashboardStats stats={stats}/><section className="panel"><div className="panel-heading"><div><p className="eyebrow">ADMIN CONTROL</p><h2>Food post management</h2><p className="muted">Review submissions and approve or reject food posts.</p></div><span className="count-pill">{foods.length} posts</span></div>
    <div className="filter-row">{["All","Pending Admin Verification","Available","Rejected","Claimed"].map(s => <button key={s} className={filter===s?"filter active":"filter"} onClick={()=>setFilter(s)}>{s==="Pending Admin Verification"?"Pending":s}</button>)}</div>
    {shown.length ? <div className="food-grid">{shown.map(item => <FoodPost key={item.id} item={item} admin onUpdate={onUpdate}/>)}</div> : <Empty title="No food posts found" text="Food submissions will appear here when donors add them."/>}
  </section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">RECIPIENT MANAGEMENT</p><h2>Claim records</h2></div><span className="count-pill">{stats[3].value} claims</span></div>
    {foods.filter(f=>f.claimStatus==="Claimed").length ? <div className="table-wrap"><table><thead><tr><th>Food</th><th>Donor</th><th>Recipient</th><th>Recipient phone</th><th>Pickup location</th></tr></thead><tbody>{foods.filter(f=>f.claimStatus==="Claimed").map(f=><tr key={f.id}><td>{f.foodName}</td><td>{f.donorName}</td><td>{f.recipient?.name}</td><td>{f.recipient?.phone}</td><td>{f.location}</td></tr>)}</tbody></table></div> : <Empty title="No claims yet" text="Recipient claims will be listed here."/>}
  </section></>;
}

function DonorDashboard({ session, food, setFood, onSubmit, foods }) {
  const change = (key,value) => setFood(prev => ({...prev,[key]:value}));
  return <><section className="panel"><div className="panel-heading"><div><p className="eyebrow">DONOR MODULE</p><h2>Share surplus food</h2><p className="muted">Add accurate details so recipients can collect food safely.</p></div><span className="panel-icon"><PlusCircle size={22}/></span></div>
    <form className="food-form" onSubmit={onSubmit}><div className="form-grid"><div><label>Food name</label><input required value={food.foodName} onChange={e=>change("foodName",e.target.value)} placeholder="e.g. Vegetable rice"/></div><div><label>Quantity</label><input required value={food.quantity} onChange={e=>change("quantity",e.target.value)} placeholder="e.g. 20 plates"/></div><div><label>Contact phone</label><input required type="tel" value={food.phone} onChange={e=>change("phone",e.target.value)} placeholder="Phone number"/></div><div><label>Pickup location</label><input required value={food.location} onChange={e=>change("location",e.target.value)} placeholder="Pickup address"/></div><div className="full-field"><label>Expiry date and time</label><input required type="datetime-local" min={new Date().toISOString().slice(0,16)} value={food.expiry} onChange={e=>change("expiry",e.target.value)}/></div></div><button className="btn btn-primary" type="submit"><PlusCircle size={17}/> Submit food for verification</button></form>
  </section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>My submitted food</h2><p className="muted">Track the review and claim status of your donations.</p></div><span className="count-pill">{foods.length} posts</span></div>
    {foods.length ? <div className="food-grid">{foods.map(item=><FoodPost key={item.id} item={item}/>)}</div> : <Empty title="No donations yet" text="Your submitted food posts will appear here."/>}
  </section></>;
}

function RecipientDashboard({ foods, claims, recipient, setRecipient, onClaim }) {
  const [showDetails, setShowDetails] = useState(false);
  return <><section className="panel"><div className="panel-heading"><div><p className="eyebrow">RECIPIENT MODULE</p><h2>Verified food available</h2><p className="muted">Choose a food post and provide your contact details to claim it.</p></div><span className="count-pill">{foods.length} available</span></div>
    <div className="recipient-details"><div><b>Your claim details</b><p className="muted">These details are shared with the donor/admin for pickup coordination.</p></div><button className="btn btn-outline btn-small" onClick={()=>setShowDetails(!showDetails)}>{showDetails?"Hide details":"Enter details"}</button></div>
    {showDetails && <div className="form-grid compact"><div><label>Your name</label><input value={recipient.name} onChange={e=>setRecipient(p=>({...p,name:e.target.value}))} placeholder="Full name"/></div><div><label>Phone number</label><input value={recipient.phone} onChange={e=>setRecipient(p=>({...p,phone:e.target.value}))} placeholder="Phone number"/></div><div className="full-field"><label>Your location</label><input value={recipient.location} onChange={e=>setRecipient(p=>({...p,location:e.target.value}))} placeholder="Your pickup area"/></div></div>}
    {foods.length ? <div className="food-grid">{foods.map(item=><FoodPost key={item.id} item={item} onClaim={()=>onClaim(item)}/>)}</div> : <Empty title="No verified food available" text="Please check again later. Admin-approved food posts will appear here."/>}
  </section><section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>My claims</h2></div><span className="count-pill">{claims.length} claims</span></div>
    {claims.length ? <div className="food-grid">{claims.map(item=><FoodPost key={item.id} item={item}/>)}</div> : <Empty title="No claims yet" text="Food you successfully claim will appear here."/>}
  </section></>;
}

function FoodPost({ item, admin=false, onUpdate, onClaim }) {
  const statusClass = item.status === "Available" ? "green" : item.status === "Rejected" ? "red" : item.status === "Claimed" ? "purple" : "orange";
  return <article className="food-card"><div className="food-card-top"><span className="food-emoji">🍲</span><span className={`status ${statusClass}`}>{item.status}</span></div><h3>{item.foodName}</h3><div className="food-details"><p><PackageCheck size={15}/>{item.quantity}</p><p><MapPin size={15}/>{item.location}</p><p><Phone size={15}/>{item.phone}</p><p><Clock3 size={15}/>{new Date(item.expiry).toLocaleString()}</p></div><p className="donor-line">Shared by {item.donorName}</p>
    {item.recipient && <div className="claimed-info"><b>Claimed by {item.recipient.name}</b><small>{item.recipient.phone} · {item.recipient.location}</small></div>}
    {admin && item.status === "Pending Admin Verification" && <div className="card-actions"><button className="btn btn-primary btn-small" onClick={()=>onUpdate(item.id,{status:"Available"})}><CheckCircle2 size={15}/> Verify</button><button className="btn btn-danger btn-small" onClick={()=>onUpdate(item.id,{status:"Rejected"})}><XCircle size={15}/> Reject</button></div>}
    {onClaim && <button className="btn btn-primary full-btn claim-button" onClick={onClaim}>Claim this food →</button>}
  </article>;
}

function Empty({ title, text }) {
  return <div className="empty-state"><span><Utensils size={24}/></span><h3>{title}</h3><p>{text}</p></div>;
}