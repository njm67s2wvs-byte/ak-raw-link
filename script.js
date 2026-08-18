let balance = 100;

function openModal(title, text) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalText = document.getElementById("modalText");

  if (!modal) return;

  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.style.display = "none";
  }
}

function startCall() {
  openModal(
    "🎥 بدء المكالمة",
    "سيتم فتح نظام المكالمات قريبًا."
  );
}

function buyCoins(amount) {
  openModal(
    "🪙 شراء العملات",
    "الباقة المختارة: " + amount + " عملة."
  );
}

function showLogin() {
  openModal(
    "👤 الحساب",
    "تسجيل الدخول وإنشاء حساب سيتم تفعيله قريبًا."
  );
}

function showPackages() {
  const packages = document.querySelector(".packages");

  if (packages) {
    packages.scrollIntoView({
      behavior: "smooth"
    });
  }
}

window.addEventListener("click", function (event) {
  const modal = document.getElementById("modal");

  if (event.target === modal) {
    closeModal();
  }
});
