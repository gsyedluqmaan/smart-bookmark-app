"use client";

import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
type BookmarkCardProps = {
  delay: number;
  x: number | string;
  y: number | string;
  rotate: number | string;
  color: string;
  title: string;
  tag: string;
};

const BookmarkCard = ({
  delay,
  x,
  y,
  rotate,
  color,
  title,
  tag,
}: BookmarkCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.7, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
    transition={{
      opacity: { delay, duration: 0.6 },
      scale: { delay, duration: 0.6 },
      y: {
        delay: delay + 0.6,
        duration: 3 + delay,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }}
    style={{ left: x, top: y, rotate }}
    className="absolute w-52 rounded-2xl bg-white shadow-xl shadow-[#0790e8]/10 p-3.5 border border-[#0790e8]/10"
  >
    <div className="flex items-start gap-2.5">
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
        style={{ background: color }}
      >
        {title[0]}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">{title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{tag}</p>
      </div>
      <div
        className="ml-auto flex-shrink-0 w-1.5 h-5 rounded-full"
        style={{ background: color, opacity: 0.4 }}
      />
    </div>
  </motion.div>
);

const HeroIllustration = () => (
  <svg
    viewBox="0 0 480 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    {/* desk surface */}
    <ellipse cx="240" cy="440" rx="200" ry="28" fill="#0790e8" opacity="0.07" />

    {/* monitor body */}
    <rect
      x="120"
      y="100"
      width="240"
      height="170"
      rx="16"
      fill="white"
      stroke="#0790e8"
      strokeWidth="2.5"
    />
    {/* monitor screen */}
    <rect x="132" y="112" width="216" height="140" rx="8" fill="#eef7ff" />
    {/* screen content lines */}
    <rect
      x="150"
      y="130"
      width="100"
      height="8"
      rx="4"
      fill="#0790e8"
      opacity="0.7"
    />
    <rect
      x="150"
      y="146"
      width="140"
      height="5"
      rx="2.5"
      fill="#0790e8"
      opacity="0.2"
    />
    <rect
      x="150"
      y="157"
      width="120"
      height="5"
      rx="2.5"
      fill="#0790e8"
      opacity="0.15"
    />
    {/* bookmark ribbons on screen */}
    <path
      d="M284 112 L284 140 L276 133 L268 140 L268 112 Z"
      fill="#0790e8"
      opacity="0.8"
    />
    <path
      d="M304 112 L304 135 L297 129 L290 135 L290 112 Z"
      fill="#0790e8"
      opacity="0.4"
    />
    {/* URL bar */}
    <rect
      x="150"
      y="170"
      width="180"
      height="20"
      rx="5"
      fill="white"
      stroke="#0790e8"
      strokeWidth="1"
      strokeOpacity="0.3"
    />
    <circle cx="162" cy="180" r="5" fill="#0790e8" opacity="0.3" />
    <rect
      x="172"
      y="177"
      width="80"
      height="6"
      rx="3"
      fill="#0790e8"
      opacity="0.15"
    />
    {/* grid of saved items */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect
        key={i}
        x={150 + (i % 3) * 60}
        y={200 + Math.floor(i / 3) * 26}
        width="52"
        height="18"
        rx="5"
        fill="#0790e8"
        opacity={0.07 + (i % 3) * 0.04}
      />
    ))}
    {/* monitor stand */}
    <rect x="222" y="270" width="36" height="40" rx="4" fill="#d1eaff" />
    <rect x="195" y="306" width="90" height="10" rx="5" fill="#d1eaff" />

    {/* phone to the right */}
    <rect
      x="390"
      y="200"
      width="58"
      height="100"
      rx="10"
      fill="white"
      stroke="#0790e8"
      strokeWidth="2"
    />
    <rect x="396" y="210" width="46" height="80" rx="5" fill="#eef7ff" />
    <path
      d="M408 210 L408 226 L419 219 L419 210 Z"
      fill="#0790e8"
      opacity="0.7"
    />
    <rect
      x="404"
      y="233"
      width="30"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.2"
    />
    <rect
      x="404"
      y="241"
      width="22"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.15"
    />
    <rect
      x="404"
      y="249"
      width="26"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.15"
    />
    <circle cx="419" cy="302" r="4" fill="#0790e8" opacity="0.3" />

    {/* notebook to the left */}
    <rect
      x="32"
      y="230"
      width="68"
      height="90"
      rx="8"
      fill="white"
      stroke="#0790e8"
      strokeWidth="1.5"
    />
    <rect
      x="32"
      y="230"
      width="14"
      height="90"
      rx="8"
      fill="#0790e8"
      opacity="0.15"
    />
    <rect
      x="52"
      y="248"
      width="36"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.25"
    />
    <rect
      x="52"
      y="258"
      width="28"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.15"
    />
    <rect
      x="52"
      y="268"
      width="32"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.15"
    />
    <rect
      x="52"
      y="278"
      width="24"
      height="4"
      rx="2"
      fill="#0790e8"
      opacity="0.15"
    />
    {/* bookmark ribbon on notebook */}
    <path
      d="M80 230 L80 255 L74 249 L68 255 L68 230 Z"
      fill="#0790e8"
      opacity="0.7"
    />

    {/* floating tag badges */}
    <rect
      x="60"
      y="170"
      width="54"
      height="22"
      rx="11"
      fill="#0790e8"
      opacity="0.12"
    />
    <rect
      x="66"
      y="176"
      width="42"
      height="10"
      rx="5"
      fill="#0790e8"
      opacity="0.3"
    />

    <rect
      x="360"
      y="150"
      width="64"
      height="22"
      rx="11"
      fill="#0790e8"
      opacity="0.12"
    />
    <rect
      x="366"
      y="156"
      width="52"
      height="10"
      rx="5"
      fill="#0790e8"
      opacity="0.3"
    />

    {/* decorative dots */}
    {[...Array(6)].map((_, i) => (
      <circle
        key={i}
        cx={40 + i * 80}
        cy={460}
        r="3"
        fill="#0790e8"
        opacity={0.1 + i * 0.04}
      />
    ))}

    {/* stars / sparkles */}
    <path
      d="M80 80 L83 72 L86 80 L94 83 L86 86 L83 94 L80 86 L72 83 Z"
      fill="#0790e8"
      opacity="0.2"
    />
    <path
      d="M410 80 L412 75 L414 80 L419 82 L414 84 L412 89 L410 84 L405 82 Z"
      fill="#0790e8"
      opacity="0.2"
    />
    <path
      d="M450 200 L452 196 L454 200 L458 202 L454 204 L452 208 L450 204 L446 202 Z"
      fill="#0790e8"
      opacity="0.15"
    />
  </svg>
);

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.4 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.4 35.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C37.1 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
    />
  </svg>
);

export default function Home() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/bookmarks" },
    });
  };

  return (
    <div
      className="min-h-screen bg-white flex overflow-hidden"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col flex-1 relative"
        style={{
          background: "linear-gradient(145deg, #0790e8 0%, #055aad 100%)",
        }}
      >
        {/* noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* grid lines */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* floating bookmark cards */}
        <BookmarkCard
          delay={0.9}
          x="8%"
          y="12%"
          rotate="-6deg"
          color="#ff6b6b"
          title="Design Inspiration"
          tag="design · saved 2h ago"
        />
        <BookmarkCard
          delay={1.1}
          x="42%"
          y="8%"
          rotate="4deg"
          color="#ffa94d"
          title="React Best Practices"
          tag="dev · saved 1d ago"
        />
        <BookmarkCard
          delay={1.3}
          x="12%"
          y="55%"
          rotate="-3deg"
          color="#51cf66"
          title="UX Research Methods"
          tag="research · starred"
        />
        <BookmarkCard
          delay={1.5}
          x="48%"
          y="62%"
          rotate="5deg"
          color="#845ef7"
          title="Typography Guide"
          tag="design · collection"
        />

        {/* hero illustration */}
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <HeroIllustration />
          </motion.div>
        </div>

        {/* bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="absolute bottom-10 left-10 right-10"
        >
          <p className="text-white/90 text-xl font-semibold leading-snug">
            Save anything.
            <br />
            Find it instantly.
          </p>
          <p className="text-white/50 text-sm mt-2">
            Your personal library of links, and resources.
          </p>
        </motion.div>

        {/* top logo on left panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-8 left-10 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z" />
            </svg>
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            Bookmarks
          </span>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col justify-between w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 bg-white relative"
      >
        {/* subtle blue glow top-right */}
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 100% 0%, rgba(7,144,232,0.08) 0%, transparent 70%)",
          }}
        />

        {/* top mobile logo */}
        <div className="flex lg:hidden items-center gap-2 p-8 pb-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#0790e8" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z" />
            </svg>
          </div>
          <span className="font-bold text-base text-gray-800 tracking-tight">
            Bookmarks
          </span>
        </div>

        {/* ── CENTER CONTENT ── */}
        <div className="flex flex-col justify-center flex-1 px-10 xl:px-14">
          {/* heading block */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h1 className="text-4xl xl:text-[42px] font-extrabold leading-[1.1] tracking-tight text-gray-900">
              Your bookmarks,
              <br />
              <span style={{ color: "#0790e8" }}>always with you.</span>
            </h1>

            <p className="mt-4 text-gray-500 text-base leading-relaxed font-light">
              Save links, and access your personal library from anywhere — in
              one tap.
            </p>
          </motion.div>

          {/* divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 mb-8 h-px bg-gray-100 origin-left"
          />

          {/* Google CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.65,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-widest">
              Continue with
            </p>

            <motion.button
              onClick={login}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(7,144,232,0.18)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-200 bg-white cursor-pointer relative overflow-hidden group"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              {/* hover shimmer */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(7,144,232,0.04) 0%, transparent 100%)",
                }}
              />

              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <GoogleLogo />
              </div>

              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  Continue with Google
                </p>
                <p className="text-xs text-gray-400 font-light">
                  Sign in or create your account
                </p>
              </div>

              <motion.div
                className="ml-auto flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#0790e8" }}
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.button>
          </motion.div>

          {/* terms line */}
        </div>
      </motion.div>
    </div>
  );
}
