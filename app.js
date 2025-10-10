var app = app || {};

app = (function() {
  'use strict';
  
  var wheel = function() {

    var containerEl = document.getElementById('container'),

    wedgeColors = [
      '#2980B9', '#2ecc71', '#3498db', '#34495e', '#f1c40f', 
      '#e74c3c', '#16A085', '#34495E', '#C0392B', '#e98b39'
    ],

    numOfWedges = 10,
    maxRadius = 260,
    calculatedRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45, 
    wheelRadius = Math.min(maxRadius, calculatedRadius),

    maxAngularVelocity = 360 * 2.5,
    angularFriction = 0.9, // 🔧 gyorsabb lassulás
    angularVelocity = 0, 
    lastRotation = 0,
    controlled = false, 

    target,
    activeWedge,
    stage,
    layer,
    wheel,
    pointer,
    pointerTween,
    startRotation,
    startX,
    startY;


    // Fisher-Yates Shuffle
    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex ;
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    }

    shuffle(wedgeColors);

    function addWedge(n) {
      var angle = 360 / numOfWedges;

      var wedge = new Kinetic.Group({
        rotation: n * 360 / numOfWedges,
      });

      var wedgeBackground = new Kinetic.Wedge({
        radius: wheelRadius,
        angle: angle,
        fill: wedgeColors.pop(),
        rotation: (90 + angle/2) * -1
      });

      wedge.add(wedgeBackground);

      var wedgeLabels = [
        "Sütemény", "Órarend", "Sütemény és Csokoládé", "Joker", "Órarend", 
        "Joker", "Joker", "Suli toll", "Csokoládé", "Csokoládé"
      ];

      var text = new Kinetic.Text({
        text: wedgeLabels[n],
        fontFamily: 'Fredoka One',
        fontSize: wheelRadius * 0.07, 
        fill: '#000',
        align: 'center',
        opacity: 0.95,
        listening: false,
        rotation: 90 
      });
      
      text.offsetX(wheelRadius - 30);
      text.offsetY(text.height()/2);
      
      wedge.add(text);
      wheel.add(wedge);
    }
    
    function animate(frame) {
  if (!controlled) {
    if (Math.abs(angularVelocity) > 5) {
      // Erősebb fékezés, gyorsabb megállás
      angularVelocity *= 0.96;
    } else {
      // Teljes megállás, ha már nagyon lassú
      angularVelocity = 0;

      // 🔹 Gomb azonnali aktiválása
      const spinBtn = document.getElementById('spinButton');
      if (spinBtn && spinBtn.disabled) {
        spinBtn.disabled = false;
        spinBtn.textContent = 'Pörgetés';
      }
    }
  }

  if (controlled) {
    angularVelocity = ((wheel.getRotation() - lastRotation) * 1000 / frame.timeDiff);
  }

  // Kereket forgatjuk
  wheel.rotate(frame.timeDiff * angularVelocity / 1000);
  lastRotation = wheel.getRotation();

  // Mutató logika
  const intersectedWedge = layer.getIntersection({
    x: stage.width() / 2,
    y: 50
  });

  if (intersectedWedge && (!activeWedge || activeWedge._id !== intersectedWedge._id)) {
    pointerTween.reset();
    pointerTween.play();
    activeWedge = intersectedWedge;
  }
}


    

    // === GOMBBAL VALÓ PÖRGETÉS FUNKCIÓJA ===
    function spinWheel() {
      if (controlled === false && angularVelocity === 0) { 
        // Véletlenszerű, de mérsékeltebb kezdő sebesség
        angularVelocity = Math.random() * maxAngularVelocity * 0.3 + maxAngularVelocity * 0.7;

        // Gomb letiltása és szöveg módosítása
        var spinBtn = document.getElementById('spinButton');
        spinBtn.disabled = true;
        spinBtn.textContent = 'Pörgetés...';
      }
    }
    // ==========================================


    function init() {
      stage = new Kinetic.Stage({
        container: 'container',
        width: wheelRadius * 2, 
        height: wheelRadius * 2 + 20 
      });
      layer = new Kinetic.Layer();
      wheel = new Kinetic.Group({
        x: stage.getWidth() / 2 ,
        y: wheelRadius + 20
      });

      for (var n = 0; n < numOfWedges; n++) {
        addWedge(n);
      }
      
      pointer = new Kinetic.Wedge({
        fill: '#dedede',
        lineJoin: 'round',
        angle: 45,
        radius: 35,
        x: stage.getWidth() / 2,
        y: 28,
        rotation: -105
      });

      layer.add(wheel);
      layer.add(pointer);
      stage.add(layer);
      
      pointerTween = new Kinetic.Tween({
        node: pointer,
        duration: 0.1,
        easing: Kinetic.Easings.EaseInOut,
        y: 30
      });
      
      pointerTween.finish();
      layer.draw();


      function handleMovement() {
        var touchPosition = stage.getPointerPosition(),
            x1 = touchPosition.x - wheel.x(),
            y1 = touchPosition.y - wheel.y();         
      
        if (controlled && target) {
          var x2 = startX - wheel.x(),
              y2 = startY - wheel.y(),
              angle1 = Math.atan(y1 / x1) * 180 / Math.PI,
              angle2 = Math.atan(y2 / x2) * 180 / Math.PI,
              angleDiff = angle2 - angle1;
          
          if ((x1 < 0 && x2 >=0) || (x2 < 0 && x1 >=0)) {
            angleDiff += 180;
          }

          wheel.setRotation(startRotation - angleDiff);
        }
      }

      wheel.on('mousedown touchstart', function(e) {
        angularVelocity = 0; 
        controlled = true;
        target = e.target;
        startRotation = this.rotation();
        
        var touchPosition = stage.getPointerPosition();

        startX = touchPosition.x;
        startY = touchPosition.y;

        document.addEventListener('mousemove', handleMovement );
        document.addEventListener('touchmove', handleMovement );
      });
      

      function releaseTheWheel() {
        controlled = false;

        if (angularVelocity > maxAngularVelocity) {
          angularVelocity = maxAngularVelocity;
        } else if (angularVelocity < -1 * maxAngularVelocity) {
          angularVelocity = -1 * maxAngularVelocity;
        }

        document.removeEventListener('mousemove', handleMovement );
        document.removeEventListener('touchmove', handleMovement );
      }

      document.addEventListener('mouseup', releaseTheWheel );
      document.addEventListener('touchend', releaseTheWheel );
      
      document.getElementById('spinButton').addEventListener('click', spinWheel);

      var anim = new Kinetic.Animation(animate, layer);
      anim.start();
    }

    init();
    containerEl.className = 'visible';
  }

  return {
    wheel: wheel
  };
})();


window.onload = function() {
  'use strict';
  app.wheel();
};
