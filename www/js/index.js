/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    // document.getElementById('deviceready').classList.add('ready'); // This line is not needed as the element is not in the HTML
}

// This file (index.js) is now only for the login page (index.html)

const ADMIN_KEY_LOGIN = "ADH"; // Kept for consistency, though registration handles admin key
let users_login = JSON.parse(localStorage.getItem('users')) || [];

// Get references to the sections
const loginSectionGlobal = document.getElementById('login-section'); // Renamed to avoid conflict if showSection is reused

// Get references to the buttons
const loginButtonGlobal = document.getElementById('login-button');

// Helper function to show a section (specific to index.html)
function showLoginSection() {
    if (loginSectionGlobal) loginSectionGlobal.style.display = 'block';
}

// Login button functionality (only for index.html)
if (loginButtonGlobal) {
    loginButtonGlobal.addEventListener('click', () => {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username === '' || password === '') {
            Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor, ingrese usuario y contraseña.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            return;
        }

        const user = users_login.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = "menu.html";
            usernameInput.value = '';
            passwordInput.value = '';
        } else {
            Swal.fire({ icon: 'error', title: 'Error de Acceso', text: 'Usuario o contraseña incorrectos.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
        }
    });
}

// Initial setup: if on index.html, show login.
if (loginSectionGlobal) {
    showLoginSection();
}
