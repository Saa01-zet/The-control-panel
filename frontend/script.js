const API = "http://127.0.0.1:8000";
let users = [];
let searchTerm = "";
let sortOrder = "none"; // none, asc, desc

// Элементы
const usersContainer = document.getElementById("usersContainer");
const searchInput = document.getElementById("searchInput");
const createBtn = document.getElementById("createBtn");
const themeBtn = document.getElementById("themeBtn");
const sortAscBtn = document.getElementById("sortAscBtn");
const sortDescBtn = document.getElementById("sortDescBtn");
const messageBox = document.getElementById("messageBox");

// ========== СООБЩЕНИЯ ==========
function showMessage(text, isError = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${isError ? "error" : "success"}`;
    msgDiv.innerHTML = isError ? `❌ ${text}` : `✅ ${text}`;
    messageBox.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 3000);
}

// ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ ==========
async function loadUsers() {
    try {
        const resp = await fetch(`${API}/users`);
        if (!resp.ok) throw new Error("Ошибка загрузки");
        users = await resp.json();
        renderUsers();
    } catch (err) {
        showMessage("Сервер не запущен", true);
    }
}

// ========== ОТРИСОВКА КАРТОЧЕК (Задание 1) ==========
function renderUsers() {
    let filteredUsers = [...users];

    // Фильтрация (Задание 7)
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(u =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Сортировка (Задание 8)
    if (sortOrder === "asc") {
        filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
    } else if (sortOrder === "desc") {
        filteredUsers.sort((a, b) => b.username.localeCompare(a.username));
    }

    if (filteredUsers.length === 0) {
        usersContainer.innerHTML = '<div class="empty-state">📭 Нет пользователей</div>';
        return;
    }

    let html = "";
    for (let u of filteredUsers) {
        html += `
            <div class="user-card">
                <h3>${escapeHtml(u.username)}</h3>
                <p>🆔 ID: ${u.id}</p>
                <p>👤 Роль: <span class="role">${u.role === "admin" ? "Админ" : "Пользователь"}</span></p>
                <div class="actions">
                    <button class="delete-btn" onclick="deleteUserById(${u.id})">🗑️ Удалить</button>
                    <button class="edit-btn" onclick="openChangePass(${u.id})">🔑 Изменить</button>
                </div>
            </div>
        `;
    }
    usersContainer.innerHTML = html;
}

// ========== СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ (Задание 2) ==========
async function createUser() {
    const username = document.getElementById("createName").value.trim();
    const password = document.getElementById("createPass").value;
    const role = document.getElementById("createRole").value;

    if (!username) {
        showMessage("Введите логин", true);
        return;
    }
    if (!password || password.length < 6) {
        showMessage("Пароль минимум 6 символов", true);
        return;
    }

    try {
        const resp = await fetch(`${API}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
        });

        if (resp.ok) {
            showMessage("Пользователь успешно создан");
            document.getElementById("createName").value = "";
            document.getElementById("createPass").value = "";
            loadUsers(); // Автообновление (Задание 2)
        } else {
            const err = await resp.json();
            showMessage(err.detail || "Ошибка", true); // Задание 5
        }
    } catch {
        showMessage("Ошибка сервера", true);
    }
}

// ========== УДАЛЕНИЕ С ПОДТВЕРЖДЕНИЕМ (Задание 3) ==========
async function deleteUserById(id) {
    if (confirm("Вы уверены? OK / Cancel")) { // confirm
        try {
            const resp = await fetch(`${API}/users/${id}`, { method: "DELETE" });
            if (resp.ok) {
                showMessage("Пользователь удален");
                loadUsers();
            } else {
                showMessage("Пользователь не найден", true);
            }
        } catch {
            showMessage("Ошибка", true);
        }
    }
}

// ========== ИЗМЕНЕНИЕ ПАРОЛЯ ==========
async function openChangePass(id) {
    const newPass = prompt("Введите новый пароль (мин 6 символов)");
    if (!newPass) return;
    if (newPass.length < 6) {
        showMessage("Пароль минимум 6 символов", true);
        return;
    }

    try {
        const userResp = await fetch(`${API}/users/${id}`);
        if (!userResp.ok) {
            showMessage("Пользователь не найден", true);
            return;
        }
        const user = await userResp.json();

        const resp = await fetch(`${API}/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.username, password: newPass, role: user.role })
        });

        if (resp.ok) {
            showMessage("Пароль изменен");
            loadUsers();
        } else {
            showMessage("Ошибка", true);
        }
    } catch {
        showMessage("Ошибка", true);
    }
}

// ========== ПОИСК БЕЗ КНОПКИ (Задание 7) ==========
searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderUsers();
});

// ========== СОРТИРОВКА (Задание 8) ==========
sortAscBtn.addEventListener("click", () => {
    sortOrder = "asc";
    renderUsers();
});

sortDescBtn.addEventListener("click", () => {
    sortOrder = "desc";
    renderUsers();
});

// ========== ТЁМНАЯ ТЕМА + localStorage (Задания 9 и 10) ==========
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.body.setAttribute("data-theme", savedTheme);
        themeBtn.textContent = savedTheme === "dark" ? "☀️ Светлая тема" : "🌙 Темная тема";
    }
}

themeBtn.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme); // Задание 10
    themeBtn.textContent = newTheme === "dark" ? "☀️ Светлая тема" : "🌙 Темная тема";
});

// ========== ЗАЩИТА ОТ XSS ==========
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

// ========== ЗАПУСК ==========
loadTheme();
loadUsers();
createBtn.addEventListener("click", createUser);