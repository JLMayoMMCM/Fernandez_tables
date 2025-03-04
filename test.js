let base64password = "TGFuY2UwNTE2";



function decodeBase64(base64password) {
  return atob(base64password);
}


console.log(decodeBase64(base64password)); // Output: "Lance0516"