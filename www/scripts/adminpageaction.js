var sessionCookie = getSessionIDCookie(document.cookie);

function logOutPageAction(){
  logOut(sessionCookie.sessionid, function(isLoggedOut, err){
    if (err){
      throw err;
    }
    window.location.href = "/admin";
  });
}
