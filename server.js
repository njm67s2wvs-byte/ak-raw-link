const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());

app.use(
  express.json({
    limit: "20mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb"
  })
);

/* =========================
   STATIC WEBSITE
========================= */

app.use(
  express.static(__dirname)
);


/* =========================
   CONFIG
========================= */

const COIN_PACKAGES = [
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
];


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


/* =========================
   HEALTH
========================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,
      service: "VidoCall",
      status: "online"
    });

  }
);


/* =========================
   APP CONFIG
========================= */

app.get(
  "/api/config",
  (req, res) => {

    res.json({

      ok: true,

      service: "VidoCall",

      public: {

        publicVideoRate: 20,

        privateVideoRate: 90,

        newUserCoins: 120,

        minimumAge: 18

      },

      packages: COIN_PACKAGES

    });

  }
);


/* =========================
   USERS
========================= */

/*
  مؤقتًا يتم استخدام بيانات تجريبية
  إلى أن نربط Supabase في الخطوة التالية.
*/

const demoUsers = [

  {
    id: "demo-user-1",

    display_name: "Sara",

    age: 22,

    gender: "female",

    country: "Egypt",

    avatar_url:
      "https://i.pravatar.cc/600?img=47",

    verified: true,

    online: true

  },

  {
    id: "demo-user-2",

    display_name: "Lina",

    age: 24,

    gender: "female",

    country: "France",

    avatar_url:
      "https://i.pravatar.cc/600?img=44",

    verified: true,

    online: true

  },

  {
    id: "demo-user-3",

    display_name: "Maya",

    age: 21,

    gender: "female",

    country: "Saudi Arabia",

    avatar_url:
      "https://i.pravatar.cc/600?img=45",

    verified: true,

    online: true

  },

  {
    id: "demo-user-4",

    display_name: "Nora",

    age: 26,

    gender: "female",

    country: "United Arab Emirates",

    avatar_url:
      "https://i.pravatar.cc/600?img=49",

    verified: true,

    online: true

  }

];


app.get(
  "/api/users",
  (req, res) => {

    const country =
      req.query.country || "";


    let users =
      demoUsers;


    if (country) {

      users =
        users.filter(
          user =>
            user.country ===
            country
        );

    }


    res.json({

      ok: true,

      users

    });

  }
);


/* =========================
   FRIEND REQUEST
========================= */

app.post(
  "/api/friends/request",
  (req, res) => {

    const {
      senderId,
      receiverId
    } = req.body;


    if (
      !senderId ||
      !receiverId
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "senderId and receiverId are required"

        });

    }


    /*
      سيتم حفظ الطلب في Supabase
      بعد تركيب قاعدة البيانات.
    */

    res.json({

      ok: true,

      message:
        "Friend request created",

      request: {

        senderId,

        receiverId,

        status: "pending"

      }

    });

  }
);


/* =========================
   START VIDEO MATCH
========================= */

app.post(
  "/api/match",
  (req, res) => {

    const {
      userId
    } = req.body;


    if (!userId) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "userId is required"

        });

    }


    const available =
      demoUsers.filter(
        user =>
          user.id !== userId &&
          user.online === true &&
          user.verified === true
      );


    if (!available.length) {

      return res.json({

        ok: true,

        matched: false,

        user: null

      });

    }


    const randomUser =
      available[
        Math.floor(
          Math.random() *
          available.length
        )
      ];


    res.json({

      ok: true,

      matched: true,

      rate: 20,

      user: randomUser

    });

  }
);


/* =========================
   PRIVATE CALL
========================= */

app.post(
  "/api/calls/private",
  (req, res) => {

    const {
      callerId,
      receiverId
    } = req.body;


    if (
      !callerId ||
      !receiverId
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "callerId and receiverId are required"

        });

    }


    res.json({

      ok: true,

      call: {

        type: "private",

        rate: 90,

        callerId,

        receiverId,

        status: "created"

      }

    });

  }
);


/* =========================
   COIN BALANCE
========================= */

app.get(
  "/api/wallet/:userId",
  (req, res) => {

    /*
      مؤقتًا 120.

      لاحقًا سيتم جلب الرصيد الحقيقي
      من Supabase.
    */

    res.json({

      ok: true,

      userId:
        req.params.userId,

      coins: 120

    });

  }
);


/* =========================
   PURCHASE
========================= */

app.post(
  "/api/payments/create",
  (req, res) => {

    const {
      userId,
      packageId,
      country
    } = req.body;


    if (
      !userId ||
      !packageId
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "userId and packageId are required"

        });

    }


    const selectedPackage =
      COIN_PACKAGES.find(
        item =>
          item.id === packageId
      );


    if (!selectedPackage) {

      return res.status(404)
        .json({

          ok: false,

          error:
            "Package not found"

        });

    }


    /*
      مهم:

      هنا لن نزعم أن الدفع الحقيقي
      تم.

      هذا endpoint فقط ينشئ طلب دفع.

      بوابة الدفع الحقيقية سيتم تركيبها
      بعد تحديد الدولة ومزود الدفع.
    */


    const paymentId =
      "PAY-" +
      Date.now();


    res.json({

      ok: true,

      payment: {

        id: paymentId,

        userId,

        packageId,

        country:
          country || null,

        coins:
          selectedPackage.coins,

        priceUSD:
          selectedPackage.priceUSD,

        status:
          "pending"

      }

    });

  }
);


/* =========================
   ADMIN TOP UP
========================= */

app.post(
  "/api/admin/topup",
  (req, res) => {

    const {
      adminId,
      userId,
      coins
    } = req.body;


    if (
      !adminId ||
      !userId ||
      !coins
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "adminId, userId and coins are required"

        });

    }


    const amount =
      Number(coins);


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "Invalid coin amount"

        });

    }


    /*
      مهم:

      لن نعطي صلاحية شحن حقيقية
      لأي شخص من الواجهة.

      لاحقًا سيتم التحقق من adminId
      من Supabase/Auth ثم تنفيذ العملية
      على السيرفر.
    */


    res.json({

      ok: true,

      message:
        "Admin top-up request received",

      userId,

      coins:
        amount

    });

  }
);


/* =========================
   GIFTS
========================= */

const GIFTS = [

  {
    id: "rose",
    name: "وردة",
    coins: 20
  },

  {
    id: "heart",
    name: "قلب",
    coins: 50
  },

  {
    id: "diamond",
    name: "ماسة",
    coins: 100
  },

  {
    id: "crown",
    name: "تاج",
    coins: 250
  },

  {
    id: "rocket",
    name: "صاروخ",
    coins: 500
  }

];


app.get(
  "/api/gifts",
  (req, res) => {

    res.json({

      ok: true,

      gifts: GIFTS

    });

  }
);


app.post(
  "/api/gifts/send",
  (req, res) => {

    const {
      senderId,
      receiverId,
      giftId
    } = req.body;


    const gift =
      GIFTS.find(
        item =>
          item.id === giftId
      );


    if (
      !senderId ||
      !receiverId ||
      !gift
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "Invalid gift request"

        });

    }


    res.json({

      ok: true,

      message:
        "Gift request created",

      gift,

      senderId,

      receiverId

    });

  }
);


/* =========================
   EARNINGS
========================= */

app.get(
  "/api/earnings/:userId",
  (req, res) => {

    res.json({

      ok: true,

      userId:
        req.params.userId,

      earningCoins: 0,

      availableForWithdrawal: 0,

      pendingWithdrawal: 0

    });

  }
);


/* =========================
   WITHDRAWAL
========================= */

app.post(
  "/api/withdrawals",
  (req, res) => {

    const {
      userId,
      amount,
      method,
      account
    } = req.body;


    if (
      !userId ||
      !amount ||
      !method ||
      !account
    ) {

      return res.status(400)
        .json({

          ok: false,

          error:
            "Missing withdrawal information"

        });

    }


    res.json({

      ok: true,

      withdrawal: {

        id:
          "WD-" +
          Date.now(),

        userId,

        amount,

        method,

        account,

        status:
          "pending"

      }

    });

  }
);


/* =========================
   404 API
========================= */

app.use(
  "/api",
  (req, res) => {

    res.status(404)
      .json({

        ok: false,

        error:
          "API endpoint not found"

      });

  }
);


/* =========================
   ERROR HANDLER
========================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      error
    );


    res.status(500)
      .json({

        ok: false,

        error:
          "Internal server error"

      });

  }
);


/* =========================
   START SERVER
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `VidoCall server running on port ${PORT}`
    );

  }
);
