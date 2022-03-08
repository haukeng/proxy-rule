const key = "waqi_token";

const success = "✅ Get token successfully!";
const update = "✅ Token update successfully!";
const existed = "⚠️ This page didn't contain token";
const error = "❌ Get token failed!";

const successMessage = "The token is:";
const existedMessage = "But you already have a token:"
const errorMessage = "Please contact author to get help.";

const tokenRegex = /token=(\w{40})/;
const [_, token] = $response.body.match(tokenRegex);

if (token && !$prefs.valueForKey(key)) {
  $notify(success, successMessage, token);
  $prefs.setValueForKey(token, key);
} else if (token && $prefs.valueForKey(key)) {
  $notify(update, successMessage, token);
  $prefs.removeValueForKey(key);
  $prefs.setValueForKey(token, key);
} else if (!token && $prefs.valueForKey(key)) {
  $notify(existed, existedMessage, $prefs.valueForKey(key));
} else {
  $notify(error, errorMessage, "");
}

$done();
