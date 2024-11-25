var images = ["img/apent55.gif","img/ASU.gif", "img/3dbonehead.gif","img/4RNn.gif","img/86yA.gif","img/Ryokosword.gif","img/TL80.gif"]

var imgState = 0;

var imgTag = document.getElementById("imgClick");

imgTag.addEventListener("click", function (event)  {                    
  imgState = (++imgState % 7);
  event.target.src = images[imgState];
});

//https://jsfiddle.net/ffd7tmwy/1/