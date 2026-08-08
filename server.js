```js
/*
========================================================
                    AK RAW LINK
             Single-file Code Hosting
========================================================

Install:
    npm init -y
    npm install express

Run:
    node server.js

Then open:
    http://localhost:3000

For a public website, deploy this server on a Node.js host
and connect your domain to it.

========================================================
*/

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "ak-data.json");

/*
========================================================
                    DATABASE
========================================================
*/

let codes = {};

function loadDatabase() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            codes = JSON.parse(
                fs.readFileSync(DATA_FILE, "utf8")
            );
        }
    } catch {
        codes = {};
    }
}

function saveDatabase() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(codes, null, 2),
        "utf8"
    );
}

loadDatabase();

/*
========================================================
                    SERVER SETTINGS
========================================================
*/

app.disable("x-powered-by");

app.use(
    express.json({
        limit: "50mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb"
    })
);

/*
========================================================
                    HELPERS
========================================================
*/

function createId() {
    return crypto
        .randomBytes(8)
        .toString("hex");
}

function cleanName(name) {

    name = String(name || "code")
        .trim()
        .toLowerCase();

    name = name
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!name) {
        name = "code";
    }

    return name.substring(0, 40);
}

function createSlug(name) {

    const safeName = cleanName(name);

    let id = createId();

    return `${safeName}-${id}`;
}

function getBaseUrl(req) {

    const forwarded =
        req.headers["x-forwarded-proto"];

    const protocol =
        forwarded ||
        req.protocol;

    return `${protocol}://${req.get("host")}`;
}

/*
========================================================
                    CREATE CODE
========================================================
*/

app.post("/api/create", (req, res) => {

    try {

        const code =
            typeof req.body.code === "string"
                ? req.body.code
                : "";

        const name =
            typeof req.body.name === "string"
                ? req.body.name
                : "code";

        if (!code.trim()) {

            return res.status(400).json({
                success: false,
                error: "Code cannot be empty."
            });
        }

        if (code.length > 20 * 1024 * 1024) {

            return res.status(413).json({
                success: false,
                error: "Code file is too large."
            });
        }

        const slug =
            createSlug(name);

        codes[slug] = {

            id: slug,

            name: cleanName(name),

            code: code,

            active: true,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        saveDatabase();

        const base =
            getBaseUrl(req);

        res.json({

            success: true,

            id: slug,

            name: codes[slug].name,

            rawUrl:
                `${base}/raw/${encodeURIComponent(slug)}`,

            manageUrl:
                `${base}/manage/${encodeURIComponent(slug)}`
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            error:
                "Unable to create code."
        });
    }
});

/*
========================================================
                    GET CODE INFO
========================================================
*/

app.get("/api/code/:id", (req, res) => {

    const id =
        req.params.id;

    const item =
        codes[id];

    if (!item) {

        return res.status(404).json({
            success: false,
            error: "Code not found."
        });
    }

    res.json({

        success: true,

        id: item.id,

        name: item.name,

        active: item.active,

        createdAt: item.createdAt,

        updatedAt: item.updatedAt
    });
});

/*
========================================================
                    UPDATE CODE
========================================================
*/

app.put("/api/code/:id", (req, res) => {

    const id =
        req.params.id;

    const item =
        codes[id];

    if (!item) {

        return res.status(404).json({
            success: false,
            error: "Code not found."
        });
    }

    if (
        typeof req.body.code !== "string" ||
        !req.body.code.trim()
    ) {

        return res.status(400).json({
            success: false,
            error: "Code cannot be empty."
        });
    }

    if (req.body.code.length > 20 * 1024 * 1024) {

        return res.status(413).json({
            success: false,
            error: "Code is too large."
        });
    }

    item.code =
        req.body.code;

    item.updatedAt =
        new Date().toISOString();

    saveDatabase();

    res.json({
        success: true,
        message: "Code updated successfully."
    });
});

/*
========================================================
                    ENABLE
========================================================
*/

app.post("/api/code/:id/enable", (req, res) => {

    const item =
        codes[req.params.id];

    if (!item) {

        return res.status(404).json({
            success: false,
            error: "Code not found."
        });
    }

    item.active = true;

    item.updatedAt =
        new Date().toISOString();

    saveDatabase();

    res.json({
        success: true,
        message: "Raw link enabled."
    });
});

/*
========================================================
                    DISABLE
========================================================
*/

app.post("/api/code/:id/disable", (req, res) => {

    const item =
        codes[req.params.id];

    if (!item) {

        return res.status(404).json({
            success: false,
            error: "Code not found."
        });
    }

    item.active = false;

    item.updatedAt =
        new Date().toISOString();

    saveDatabase();

    res.json({
        success: true,
        message: "Raw link disabled."
    });
});

/*
========================================================
                    DELETE
========================================================
*/

app.delete("/api/code/:id", (req, res) => {

    const id =
        req.params.id;

    if (!codes[id]) {

        return res.status(404).json({
            success: false,
            error: "Code not found."
        });
    }

    delete codes[id];

    saveDatabase();

    res.json({
        success: true,
        message: "Code deleted."
    });
});

/*
========================================================
                    RAW CODE
========================================================
*/

app.get("/raw/:id", (req, res) => {

    const item =
        codes[req.params.id];

    if (!item) {

        return res
            .status(404)
            .type("text/plain")
            .send("AK Raw Link: Code not found.");
    }

    if (!item.active) {

        return res
            .status(410)
            .type("text/plain")
            .send("AK Raw Link: This link has been disabled.");
    }

    /*
        Important:
        Return the exact original code.
        No HTML page.
        No formatting.
        No encryption.
    */

    res
        .status(200)
        .set(
            "Cache-Control",
            "no-store"
        )
        .type("text/plain; charset=utf-8")
        .send(item.code);
});

/*
========================================================
                    MAIN WEBSITE
========================================================
*/

const HTML = String.raw`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1"
>

<title>AK Raw Link</title>

<style>

*{
    box-sizing:border-box;
}

:root{

    --green:#00ff88;

    --green2:#00c96b;

    --bg:#020604;

    --card:#07100a;

    --border:#173526;

    --text:#edfff4;

    --muted:#71867a;

    --danger:#ff5f6d;
}

body{

    margin:0;

    min-height:100vh;

    padding:20px 12px;

    background:
        radial-gradient(
            circle at 50% -10%,
            rgba(0,255,136,.20),
            transparent 42%
        ),
        radial-gradient(
            circle at 100% 100%,
            rgba(0,180,100,.08),
            transparent 35%
        ),
        var(--bg);

    color:var(--text);

    font-family:
        Inter,
        Arial,
        sans-serif;
}

.container{

    width:min(100%,1050px);

    margin:auto;
}

.header{

    text-align:center;

    padding:18px 0 27px;
}

.logo{

    width:72px;

    height:72px;

    margin:auto;

    display:flex;

    align-items:center;

    justify-content:center;

    border-radius:22px;

    background:
        linear-gradient(
            135deg,
            var(--green),
            var(--green2)
        );

    color:#02150a;

    font-size:27px;

    font-weight:1000;

    letter-spacing:-2px;

    box-shadow:
        0 0 50px
        rgba(0,255,136,.20);
}

.brand{

    margin-top:15px;

    font-size:
        clamp(32px,7vw,54px);

    font-weight:950;

    letter-spacing:-2px;
}

.brand span{

    color:var(--green);
}

.subtitle{

    margin-top:8px;

    color:var(--muted);

    font-size:14px;
}

.card{

    background:
        linear-gradient(
            180deg,
            rgba(10,20,13,.96),
            rgba(5,12,8,.96)
        );

    border:
        1px solid
        rgba(0,255,136,.14);

    border-radius:24px;

    padding:20px;

    box-shadow:
        0 30px 100px
        rgba(0,0,0,.48);
}

.field-title{

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-bottom:10px;

    font-size:13px;

    font-weight:900;
}

.counter{

    color:#587064;

    font-weight:500;
}

.name{

    width:100%;

    height:50px;

    margin-bottom:12px;

    padding:0 15px;

    background:#020503;

    color:white;

    border:
        1px solid
        var(--border);

    border-radius:12px;

    outline:none;

    font-size:14px;
}

.name:focus{

    border-color:var(--green);
}

textarea{

    width:100%;

    height:520px;

    min-height:350px;

    resize:vertical;

    padding:17px;

    background:#020503;

    color:#dffff0;

    border:
        1px solid
        var(--border);

    border-radius:15px;

    outline:none;

    font-family:
        Consolas,
        Monaco,
        monospace;

    font-size:14px;

    line-height:1.65;

    tab-size:4;
}

textarea:focus{

    border-color:var(--green);

    box-shadow:
        0 0 0 3px
        rgba(0,255,136,.06);
}

textarea::placeholder{

    color:#3b5045;
}

.controls{

    display:grid;

    grid-template-columns:
        1fr 1fr;

    gap:10px;

    margin-top:12px;
}

button,
.file{

    height:52px;

    border-radius:12px;

    border:
        1px solid
        var(--border);

    background:#09130d;

    color:#dcf5e5;

    display:flex;

    align-items:center;

    justify-content:center;

    font-weight:900;

    cursor:pointer;

    transition:.18s;
}

button:hover,
.file:hover{

    border-color:var(--green);

    transform:translateY(-1px);
}

.file{

    position:relative;
}

.file input{

    position:absolute;

    inset:0;

    opacity:0;

    cursor:pointer;
}

.generate{

    grid-column:1/-1;

    border:0;

    color:#02170b;

    background:
        linear-gradient(
            135deg,
            var(--green),
            var(--green2)
        );

    font-size:16px;

    box-shadow:
        0 10px 35px
        rgba(0,255,136,.12);
}

.status{

    min-height:22px;

    margin-top:13px;

    text-align:center;

    color:var(--muted);

    font-size:13px;
}

.panel{

    display:none;

    margin-top:17px;

    padding:17px;

    border:
        1px solid
        #183a29;

    border-radius:15px;

    background:#040a06;
}

.panel h2{

    margin:0 0 13px;

    color:var(--green);

    font-size:16px;
}

.raw-url{

    width:100%;

    height:46px;

    padding:0 12px;

    background:#020503;

    color:#bfffd8;

    border:
        1px solid
        #193a29;

    border-radius:10px;

    font-family:monospace;

    outline:none;
}

.actions{

    display:grid;

    grid-template-columns:
        repeat(3,1fr);

    gap:8px;

    margin-top:9px;
}

.danger{

    color:#ff9aa1;

    border-color:
        rgba(255,80,95,.25);
}

.footer{

    padding:17px;

    text-align:center;

    color:#3e5146;

    font-size:11px;
}

@media(max-width:650px){

    body{

        padding:12px 8px;
    }

    .card{

        padding:12px;

        border-radius:18px;
    }

    textarea{

        height:430px;
    }

    .controls{

        grid-template-columns:1fr;
    }

    .generate{

        grid-column:auto;
    }

    .actions{

        grid-template-columns:1fr;
    }
}

</style>

</head>

<body>

<div class="container">

<header class="header">

<div class="logo">
AK
</div>

<div class="brand">
AK <span>Raw Link</span>
</div>

<div class="subtitle">
Fast and simple raw code hosting
</div>

</header>

<main class="card">

<div class="field-title">

<span>
Code Name
</span>

<span>
Optional
</span>

</div>

<input
    id="name"
    class="name"
    maxlength="40"
    placeholder="my-script"
>

<div class="field-title">

<span>
Source Code
</span>

<span
    id="counter"
    class="counter"
>
0 characters
</span>

</div>

<textarea
    id="code"
    spellcheck="false"
    placeholder="Paste your code here..."
></textarea>

<div class="controls">

<label class="file">

Upload Code File

<input
    id="file"
    type="file"
>
</label>

<button onclick="clearCode()">
Clear
</button>

<button
    class="generate"
    onclick="generate()"
>
Generate
</button>

</div>

<div
    id="status"
    class="status"
></div>

<div
    id="panel"
    class="panel"
>

<h2>
Your Raw Link
</h2>

<input
    id="rawUrl"
    class="raw-url"
    readonly
>

<div class="actions">

<button onclick="copyUrl()">
Copy
</button>

<button onclick="openRaw()">
Open Raw
</button>

<button
    class="danger"
    onclick="disableCode()"
>
Disable
</button>

</div>

<div class="actions">

<button onclick="enableCode()">
Enable
</button>

<button onclick="updateCode()">
Update
</button>

<button
    class="danger"
    onclick="deleteCode()"
>
Delete
</button>

</div>

</div>

</main>

<div class="footer">
AK Raw Link • Code Hosting
</div>

</div>

<script>

const code =
document.getElementById("code");

const name =
document.getElementById("name");

const file =
document.getElementById("file");

const counter =
document.getElementById("counter");

const statusBox =
document.getElementById("status");

const panel =
document.getElementById("panel");

const rawUrl =
document.getElementById("rawUrl");

let currentId = null;

code.addEventListener(
    "input",
    updateCounter
);

function updateCounter(){

    counter.textContent =
        code.value.length
        .toLocaleString()
        + " characters";
}

file.addEventListener(
    "change",
    function(){

        const selected =
            this.files[0];

        if(!selected)
            return;

        const reader =
            new FileReader();

        reader.onload =
            function(event){

                code.value =
                    event.target.result;

                if(
                    !name.value
                ){

                    name.value =
                        selected.name
                        .replace(
                            /\.[^/.]+$/,
                            ""
                        );
                }

                updateCounter();

                setStatus(
                    "File loaded successfully.",
                    true
                );
            };

        reader.onerror =
            function(){

                setStatus(
                    "Unable to read file.",
                    false
                );
            };

        reader.readAsText(selected);
    }
);

function setStatus(
    message,
    success
){

    statusBox.textContent =
        message;

    statusBox.style.color =
        success
            ? "#00ff88"
            : "#ff6666";
}

async function generate(){

    if(!code.value.trim()){

        setStatus(
            "Please enter or upload your code first.",
            false
        );

        return;
    }

    setStatus(
        "Generating your raw link...",
        true
    );

    /*
        Small delay for a polished UI.
    */

    await new Promise(
        resolve =>
            setTimeout(resolve, 2000)
    );

    try{

        const response =
            await fetch(
                "/api/create",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        name:
                            name.value ||
                            "code",

                        code:
                            code.value

                    })
                }
            );

        const data =
            await response.json();

        if(!response.ok){

            throw new Error(
                data.error ||
                "Unable to create link."
            );
        }

        currentId =
            data.id;

        rawUrl.value =
            data.rawUrl;

        panel.style.display =
            "block";

        setStatus(
            "Raw link created successfully.",
            true
        );

    }catch(error){

        setStatus(
            error.message,
            false
        );
    }
}

async function updateCode(){

    if(!currentId)
        return;

    if(!code.value.trim()){

        setStatus(
            "Code cannot be empty.",
            false
        );

        return;
    }

    try{

        const response =
            await fetch(
                "/api/code/" +
                encodeURIComponent(
                    currentId
                ),
                {
                    method:"PUT",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({
                        code:
                            code.value
                    })
                }
            );

        const data =
            await response.json();

        if(!response.ok)
            throw new Error(
                data.error ||
                "Update failed."
            );

        setStatus(
            "Code updated successfully.",
            true
        );

    }catch(error){

        setStatus(
            error.message,
            false
        );
    }
}

async function disableCode(){

    if(!currentId)
        return;

    try{

        const response =
            await fetch(
                "/api/code/" +
                encodeURIComponent(
                    currentId
                ) +
                "/disable",
                {
                    method:"POST"
                }
            );

        if(!response.ok)
            throw new Error(
                "Unable to disable link."
            );

        setStatus(
            "Raw link disabled.",
            true
        );

    }catch(error){

        setStatus(
            error.message,
            false
        );
    }
}

async function enableCode(){

    if(!currentId)
        return;

    try{

        const response =
            await fetch(
                "/api/code/" +
                encodeURIComponent(
                    currentId
                ) +
                "/enable",
                {
                    method:"POST"
                }
            );

        if(!response.ok)
            throw new Error(
                "Unable to enable link."
            );

        setStatus(
            "Raw link enabled.",
            true
        );

    }catch(error){

        setStatus(
            error.message,
            false
        );
    }
}

async function deleteCode(){

    if(!currentId)
        return;

    const confirmed =
        confirm(
            "Delete this code permanently?"
        );

    if(!confirmed)
        return;

    try{

        const response =
            await fetch(
                "/api/code/" +
                encodeURIComponent(
                    currentId
                ),
                {
                    method:"DELETE"
                }
            );

        if(!response.ok)
            throw new Error(
                "Unable to delete code."
            );

        panel.style.display =
            "none";

        rawUrl.value = "";

        currentId = null;

        setStatus(
            "Code deleted successfully.",
            true
        );

    }catch(error){

        setStatus(
            error.message,
            false
        );
    }
}

async function copyUrl(){

    if(!rawUrl.value)
        return;

    try{

        await navigator.clipboard.writeText(
            rawUrl.value
        );

        setStatus(
            "Raw link copied.",
            true
        );

    }catch{

        rawUrl.select();

        document.execCommand(
            "copy"
        );

        setStatus(
            "Raw link copied.",
            true
        );
    }
}

function openRaw(){

    if(!rawUrl.value)
        return;

    window.open(
        rawUrl.value,
        "_blank"
    );
}

function clearCode(){

    code.value = "";

    name.value = "";

    file.value = "";

    panel.style.display =
        "none";

    rawUrl.value = "";

    currentId = null;

    statusBox.textContent = "";

    updateCounter();
}

updateCounter();

</script>

</body>

</html>`;

/*
========================================================
                    SEND WEBSITE
========================================================
*/

app.get("/", (req, res) => {

    res
        .status(200)
        .type("html")
        .send(HTML);
});

/*
========================================================
                    404
========================================================
*/

app.use((req, res) => {

    res.status(404)
        .type("text/plain")
        .send("AK Raw Link: Page not found.");
});

/*
========================================================
                    START
========================================================
*/

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("          AK RAW LINK");
    console.log("=================================");
    console.log(
        `Server running on port ${PORT}`
    );
    console.log("");
});
```
