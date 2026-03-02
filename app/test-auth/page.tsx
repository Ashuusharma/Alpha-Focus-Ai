"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("SIGNUP:", data, error);
    alert(error ? error.message : "Signup success!");
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("LOGIN:", data, error);
    alert(error ? error.message : "Login success!");
  };

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    console.log("CURRENT USER:", data);
  };

  const insertProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return alert("No user");

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: "Test User",
    });

    alert(error ? error.message : "Profile inserted!");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Supabase Auth Test</h2>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />

      <button onClick={signUp}>Sign Up</button>
      <button onClick={signIn}>Sign In</button>
      <button onClick={getUser}>Check User</button>
      <button onClick={insertProfile}>Insert Profile</button>
    </div>
  );
}