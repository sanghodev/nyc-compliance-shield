async function checkImageURL() {
    const url = "https://maps.googleapis.com/maps/api/streetview?size=400x300&location=40.710905,-73.844966&key=AIzaSyCGaz-yI6cBo7rJQXe39P1XSuqYdheNId8";
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.get("content-type"));
    if (!res.ok) {
        const text = await res.text();
        console.log("Error body:");
        console.log(text);
    } else {
        console.log("OK!");
    }
}
checkImageURL();
