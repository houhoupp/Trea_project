import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const username = ref('');
  const token = ref('');
  const isLoggedIn = ref(false);

  const userInfo = computed(() => ({
    username: username.value,
    token: token.value,
    isLoggedIn: isLoggedIn.value
  }));

  function login(newUsername, newToken) {
    username.value = newUsername;
    token.value = newToken;
    isLoggedIn.value = true;
    
    sessionStorage.setItem('username', newUsername);
    sessionStorage.setItem('token', newToken);
  }

  function logout() {
    username.value = '';
    token.value = '';
    isLoggedIn.value = false;
    
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
  }

  function initFromSession() {
    const storedUsername = sessionStorage.getItem('username');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedUsername && storedToken) {
      username.value = storedUsername;
      token.value = storedToken;
      isLoggedIn.value = true;
    }
  }

  function setUsername(newUsername) {
    username.value = newUsername;
    sessionStorage.setItem('username', newUsername);
  }

  return {
    username,
    token,
    isLoggedIn,
    userInfo,
    login,
    logout,
    initFromSession,
    setUsername
  };
});
