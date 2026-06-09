const API = "http://127.0.0.1:8000";
let users = [];
let viewMode = "cards";

function showMessage(msg, isError = false) {
    const box = document.getElementById("messageBox");
    box.innerHTML = `<div class="${isError ? 'error' : 'success'}">${msg}</div>`;
    setTimeout(() => box.innerHTML = "", 3000);
}

async function getUsers() {
    try {
        const resp = await fetch(`${API}/users`);
        users = await resp.json();
        if (viewMode === "cards") showCards();
        else showTable();
    } catch (err) {
        showMessage("Ошибка: сервер не запущен", true);
    }
}

function showCards() {
    viewMode = "cards";
    if (!users.length) {
        document.getElementById("usersList").innerHTML = "<p>Нет пользователей</p>";
        return;
    }
    let html = '<div class="cards">';
    for (let u of users) {
        html += `
            <div class="card">
                <strong>${u.username}</strong><br>
                ID: ${u.id}<br>
                Роль: ${u.role === 'admin' ? 'Админ' : 'Пользователь'}<br>
                <button onclick="quickDelete(${u.id})" style="background:#dc3545">Удалить</button>
                <button onclick="quickChange(${u.id})">Сменить пароль</button>
            </div>
        `;
    }
    html += '</div>';
    document.getElementById("usersList").innerHTML = html;
}

function showTable() {
    viewMode = "table";
    if (!users.length) {
        document.getElementById("usersList").innerHTML = "<p>Нет пользователей</p>";
        return;
    }
    let html = `<table><th>ID</th><th>Логин</th><th>Роль</th><th>Действия</th>`;
    for (let u of users) {
        html += `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.role === 'admin' ? 'Админ' : 'Пользователь'}</td>
                <td>
                    <button onclick="quickDelete(${u.id})" style="background:#dc3545">Удалить</button>
                    <button onclick="quickChange(${u.id})">Сменить пароль</button>
                </td>
            </tr>
        `;
    }
    html += `</table>`;
    document.getElementById("usersList").innerHTML = html;
}

async function getCount() {
    try {
        const resp = await fetch(`${API}/users/count`);

        if (!resp.ok) {
            throw new Error("Ошибка");
        }

        const data = await resp.json();

        if (data.count !== undefined) {
            showMessage(`👥 Всего пользователей: ${data.count}`);
        } else if (typeof data === 'number') {
            showMessage(`👥 Всего пользователей: ${data}`);
        } else {
            showMessage(`👥 Всего пользователей: ${Object.values(data)[0]}`);
        }
    } catch {
        showMessage("Ошибка получения количества пользователей", true);
    }
}

async function createUser() {
    const username = document.getElementById("newName").value.trim();
    const password = document.getElementById("newPass").value;
    const role = document.getElementById("newRole").value;

    if (!username || !password) {
        showMessage("Заполните логин и пароль", true);
        return;
    }
    if (password.length < 6) {
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
            showMessage("✅ Пользователь успешно создан");
            document.getElementById("newName").value = "";
            document.getElementById("newPass").value = "";
            getUsers();
        } else {
            const err = await resp.json();
            showMessage(err.detail || "Ошибка", true);
        }
    } catch {
        showMessage("Ошибка сервера", true);
    }
}

async function searchById() {
    const id = document.getElementById("searchId").value;
    if (!id) {
        showMessage("Введите ID", true);
        return;
    }
    try {
        const resp = await fetch(`${API}/users/${id}`);
        const div = document.getElementById("searchIdResult");
        if (resp.ok) {
            const u = await resp.json();
            div.innerHTML = `<div class="result">✅ Найден: ${u.username} (ID: ${u.id}, Роль: ${u.role === 'admin' ? 'Админ' : 'Пользователь'})</div>`;
        } else {
            div.innerHTML = `<div class="result">❌ Пользователь с ID ${id} не найден</div>`;
        }
        setTimeout(() => div.innerHTML = "", 4000);
    } catch {
        showMessage("Ошибка", true);
    }
}

async function changePassword() {
    const id = document.getElementById("changeId").value;
    const newPass = document.getElementById("changePass").value;

    if (!id || !newPass) {
        showMessage("Заполните все поля", true);
        return;
    }
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
            showMessage("✅ Пароль успешно изменен");
            document.getElementById("changeId").value = "";
            document.getElementById("changePass").value = "";
            getUsers();
        } else {
            showMessage("Ошибка", true);
        }
    } catch {
        showMessage("Ошибка", true);
    }
}

async function deleteUser() {
    const id = document.getElementById("deleteId").value;
    if (!id) {
        showMessage("Введите ID", true);
        return;
    }
    if (!confirm(`Удалить пользователя ID ${id}?`)) return;

    try {
        const resp = await fetch(`${API}/users/${id}`, { method: "DELETE" });
        if (resp.ok) {
            showMessage("✅ Пользователь удален");
            document.getElementById("deleteId").value = "";
            getUsers();
        } else {
            showMessage("Пользователь не найден", true);
        }
    } catch {
        showMessage("Ошибка", true);
    }
}

function quickDelete(id) {
    document.getElementById("deleteId").value = id;
    deleteUser();
}

function quickChange(id) {
    document.getElementById("changeId").value = id;
    document.getElementById("changePass").focus();
    showMessage(`Введите новый пароль для ID ${id}`);
}

async function searchByText() {
    const text = document.getElementById("searchText").value.trim();
    if (!text) {
        showMessage("Введите логин", true);
        return;
    }
    try {
        const resp = await fetch(`${API}/users/search?text=${encodeURIComponent(text)}`);
        const found = await resp.json();
        const div = document.getElementById("searchTextResult");
        if (found.length > 0) {
            let html = '<div class="result">✅ Найдено:<br>';
            for (let u of found) {
                html += `• ${u.username} (ID: ${u.id}, ${u.role === 'admin' ? 'Админ' : 'Пользователь'})<br>`;
            }
            html += '</div>';
            div.innerHTML = html;
        } else {
            div.innerHTML = `<div class="result">❌ Не найдено: "${text}"</div>`;
        }
        setTimeout(() => div.innerHTML = "", 5000);
    } catch {
        showMessage("Ошибка", true);
    }
}