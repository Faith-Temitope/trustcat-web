// Simple client-side mock auth for demo purposes
const Auth = (function(){
  const TOKEN_KEY = 'trustcat_demo_token';
  const USER_KEY = 'trustcat_demo_user';
  const demo = { email: 'demo@trustcat.test', name: 'Demo User' };

  function isAuthenticated(){
    return !!localStorage.getItem(TOKEN_KEY);
  }

  function login(email, password){
    // Demo check: accept demo@trustcat.test / password OR any non-empty values for presentation
    if((email === 'demo@trustcat.test' && password === 'password') || (email && password)){
      localStorage.setItem(TOKEN_KEY,'demo-token-12345');
      localStorage.setItem(USER_KEY, JSON.stringify({ email, name: email === demo.email ? demo.name : email.split('@')[0] }));
      return { ok:true };
    }
    return { ok:false, message: 'Invalid credentials for demo.' };
  }

  function logout(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // update UI links
    document.querySelectorAll('#nav-login, #nav-login-2, #nav-login-3, #nav-login-4, #nav-login-5').forEach(n=>n?.classList?.remove('hidden'));
    document.querySelectorAll('#nav-profile, #nav-profile-2, #nav-profile-3, #nav-profile-4, #nav-profile-5').forEach(n=>n?.classList?.add('hidden'));
  }

  function getUser(){
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  }

  function requireAuth(redirectTo='login.html'){
    if(!isAuthenticated()){
      window.location.href = redirectTo + '?r=' + encodeURIComponent(window.location.pathname);
    }
  }

  return { isAuthenticated, login, logout, getUser, requireAuth };
})();

// Expose to global for simple pages
window.Auth = Auth;

// Provide hook to record quiz result
window.QuizStore = {
  saveResult(result){
    // result: {score, total, date}
    const key = 'trustcat_quiz_scores';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(result);
    localStorage.setItem(key, JSON.stringify(arr));
  },
  getResults(){
    return JSON.parse(localStorage.getItem('trustcat_quiz_scores') || '[]');
  }
};
