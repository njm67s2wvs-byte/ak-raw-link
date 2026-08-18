require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const {
  createClient
} = require("@supabase/supabase-js");

const {
  AccessToken
} = require("livekit-server-sdk");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================
   CONFIG
========================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL || "";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const LIVEKIT_API_KEY =
  process.env.LIVEKIT_API_KEY || "";

const LIVEKIT_API_SECRET =
  process.env.LIVEKIT_API_SECRET || "";

const LIVEKIT_URL =
  process.env.LIVEKIT_URL || "";

const ADMIN_ID =
  process.env.ADMIN_ID || "";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    : null;

/* =========================
   APP SETTINGS
========================= */

const APP_CONFIG = {
  name: "VidoCall",
  minAge: 18,

  signupBonus: 120,

  publicCallRate: 20,
  privateCallRate: 90,

  currency: "USD",

  packages: [
    {
      id: "starter",
      coins: 500,
      priceUSD: 2.99
    },
    {
      id: "popular",
      coins: 1200,
      priceUSD: 6.49
    },
    {
      id: "large",
      coins: 2500,
      priceUSD: 11.99
    },
    {
      id: "vip",
      coins: 6000,
      priceUSD: 24.99
    },
    {
      id: "mega",
      coins: 15000,
      priceUSD: 54.99
    }
  ],

  gifts: [
    {
      id: "heart",
      name: "Heart",
      coins: 10,
      emoji: "❤️"
    },
    {
      id: "rose",
      name: "Rose",
      coins: 25,
      emoji: "🌹"
    },
    {
      id: "diamond",
      name: "Diamond",
      coins: 100,
      emoji: "💎"
    },
    {
      id: "crown",
      name: "Crown",
      coins: 500,
      emoji: "👑"
    }
  ]
};

/* =========================
   SECURITY
========================= */

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

app.use(morgan("tiny"));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);

/* =========================
   FRONTEND
========================= */

app.use(
  express.static(
    path.join(__dirname)
  )
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================
   HELPERS
========================= */

function requireDatabase(res) {

  if (!supabase) {

    res.status(503).json({
      ok: false,
      error: "Database is not configured yet."
    });

    return false;
  }

  return true;
}

function isAdmin(req) {

  const id =
    req.headers["x-admin-id"];

  const secret =
    req.headers["x-admin-secret"];

  if (!ADMIN_ID || !ADMIN_SECRET) {
    return false;
  }

  return (
    id === ADMIN_ID &&
    secret === ADMIN_SECRET
  );
}

function safeNumber(value, fallback = 0) {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    service: "VidoCall",
    version: APP_CONFIG.name,
    database: Boolean(supabase),
    livekit: Boolean(
      LIVEKIT_API_KEY &&
      LIVEKIT_API_SECRET &&
      LIVEKIT_URL
    )
  });

});

/* =========================
   PUBLIC CONFIG
========================= */

app.get("/api/config", (req, res) => {

  res.json({
    ok: true,

    app: {
      name: APP_CONFIG.name,
      minAge: APP_CONFIG.minAge,
      signupBonus: APP_CONFIG.signupBonus,

      publicCallRate:
        APP_CONFIG.publicCallRate,

      privateCallRate:
        APP_CONFIG.privateCallRate
    },

    packages:
      APP_CONFIG.packages,

    gifts:
      APP_CONFIG.gifts,

    livekit: {
      configured: Boolean(
        LIVEKIT_API_KEY &&
        LIVEKIT_API_SECRET &&
        LIVEKIT_URL
      )
    }
  });

});

/* =========================
   CREATE LIVEKIT TOKEN
========================= */

app.post(
  "/api/video/token",
  async (req, res) => {

    try {

      const {
        roomName,
        participantName,
        participantId
      } = req.body;

      if (!LIVEKIT_API_KEY ||
          !LIVEKIT_API_SECRET ||
          !LIVEKIT_URL) {

        return res.status(503).json({
          ok: false,
          error: "Video service is not configured."
        });
      }

      if (!roomName) {

        return res.status(400).json({
          ok: false,
          error: "roomName is required."
        });
      }

      const identity =
        participantId ||
        `user-${Date.now()}`;

      const name =
        participantName ||
        identity;

      const token =
        new AccessToken(
          LIVEKIT_API_KEY,
          LIVEKIT_API_SECRET,
          {
            identity,
            name,
            ttl: "2h"
          }
        );

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true
      });

      const jwt =
        await token.toJwt();

      res.json({
        ok: true,
        token: jwt,
        url: LIVEKIT_URL,
        roomName,
        identity
      });

    } catch (error) {

      console.error(
        "VIDEO TOKEN ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Unable to create video token."
      });
    }

  }
);

/* =========================
   PROFILE
========================= */

app.get(
  "/api/users/:id",
  async (req, res) => {

    if (!requireDatabase(res)) {
      return;
    }

    try {

      const userId =
        req.params.id;

      const {
        data,
        error
      } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          age,
          gender,
          country,
          avatar_url,
          verified,
          online
        `)
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {

        return res.status(404).json({
          ok: false,
          error: "User not found."
        });
      }

      res.json({
        ok: true,
        user: data
      });

    } catch (error) {

      console.error(
        "PROFILE ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Unable to load profile."
      });
    }

  }
);

/* =========================
   DISCOVER USERS
========================= */

app.get(
  "/api/users",
  async (req, res) => {

    if (!requireDatabase(res)) {
      return;
    }

    try {

      const {
        country,
        gender,
        online,
        limit = 30
      } = req.query;

      let query =
        supabase
          .from("profiles")
          .select(`
            id,
            username,
            display_name,
            age,
            gender,
            country,
            avatar_url,
            verified,
            online
          `)
          .eq("verified", true)
          .gte("age", 18)
          .limit(
            Math.min(
              safeNumber(limit, 30),
              50
            )
          );

      if (country) {
        query =
          query.eq(
            "country",
            country
          );
      }

      if (gender) {
        query =
          query.eq(
            "gender",
            gender
          );
      }

      if (
        online === "true"
      ) {
        query =
          query.eq(
            "online",
            true
          );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        throw error;
      }

      res.json({
        ok: true,
        users: data || []
      });

    } catch (error) {

      console.error(
        "USERS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Unable to load users."
      });
    }

  }
);

/* =========================
   ADMIN
========================= */

app.get(
  "/api/admin/user/:id",
  async (req, res) => {

    if (!isAdmin(req)) {

      return res.status(401).json({
        ok: false,
        error: "Unauthorized."
      });
    }

    if (!requireDatabase(res)) {
      return;
    }

    try {

      const id =
        req.params.id;

      const {
        data,
        error
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {

        return res.status(404).json({
          ok: false,
          error: "User not found."
        });
      }

      res.json({
        ok: true,
        user: data
      });

    } catch (error) {

      console.error(
        "ADMIN USER ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Unable to load user."
      });
    }

  }
);

/* =========================
   ADMIN ADD COINS
========================= */

app.post(
  "/api/admin/add-coins",
  async (req, res) => {

    if (!isAdmin(req)) {

      return res.status(401).json({
        ok: false,
        error: "Unauthorized."
      });
    }

    if (!requireDatabase(res)) {
      return;
    }

    try {

      const {
        userId,
        amount
      } = req.body;

      const coins =
        safeNumber(amount);

      if (!userId ||
          coins <= 0 ||
          !Number.isInteger(coins)) {

        return res.status(400).json({
          ok: false,
          error: "Invalid userId or amount."
        });
      }

      const {
        data: wallet,
        error: walletError
      } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletError) {
        throw walletError;
      }

      if (!wallet) {

        const {
          error
        } = await supabase
          .from("wallets")
          .insert({
            user_id: userId,
            coins: coins
          });

        if (error) {
          throw error;
        }

      } else {

        const newBalance =
          safeNumber(wallet.coins) +
          coins;

        const {
          error
        } = await supabase
          .from("wallets")
          .update({
            coins: newBalance
          })
          .eq(
            "user_id",
            userId
          );

        if (error) {
          throw error;
        }
      }

      res.json({
        ok: true,
        userId,
        added: coins
      });

    } catch (error) {

      console.error(
        "ADMIN ADD COINS ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Unable to add coins."
      });
    }

  }
);

/* =========================
   404 API
========================= */

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({
      ok: false,
      error: "API endpoint not found."
    });

  }
);

/* =========================
   SERVER
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `VidoCall running on port ${PORT}`
    );

  }
);
