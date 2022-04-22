// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths

// conventions
// L: left forward, R: right forward, S: straight forward,
// l: left backwards, r: right backwards, s: straight backwards
// 0 radiants/0 degree means in generell east/right, no negative values
// position (0, 0) is the middle of the field

// #region types
type rad = number; // radiants
type pos = { x: number; y: number }; // a position
type car = { pos: pos; heading: rad }; // a cars values
// #endregion

// #region car data
// the turning radius r for the given car
const turningRadius: number = 10; // some arbitrary number for now

// if start car = (0, 0, 0) and end car = (x, 0, PI)
// then the RSR path has the length = turningRadius * PI + (|A-B|)

// start values of the car
const startCar: car = {
  pos: { x: 0, y: 0 },
  heading: degToRad(0) // 0 is right, 90 is north
};
// end/final values of the car
const goalCar: car = {
  pos: { x: 1, y: 1 },
  heading: degToRad(45)
};
// #endregion

// #region helper functions
function radToDeg(val: rad): number {
  return ((val * 180) / Math.PI) % 360;
}
function degToRad(val: number): rad {
  return ((val * Math.PI) / 180) % (2 * Math.PI);
}
function correctRad(val: rad): rad {
  if (val < 0) return Math.abs((Math.PI * 2 + val) % (Math.PI * 2));
  else return Math.abs(val % (Math.PI * 2));
}
// #endregion

// #region get turning circles middle points from car values
// get the left/right middle point of the current car (if the car steers to the left, it turns around this point with the distance r)
function getLeftCircle(car: car, r: number = turningRadius): pos {
  return {
    x: car.pos.x + r * Math.cos(car.heading + Math.PI / 2),
    y: car.pos.y + r * Math.sin(car.heading + Math.PI / 2)
  };
}
function getRightCircle(car: car, r: number = turningRadius): pos {
  return {
    x: car.pos.x - r * Math.cos(car.heading + Math.PI / 2),
    y: car.pos.y - r * Math.sin(car.heading + Math.PI / 2)
  };
}
// #endregion

// #region CSC
// RSR, (rsr) paths
function getRSR(
  car1: car = startCar,
  car2: car = goalCar,
  r: number = turningRadius
): number {
  /**
   * RSR paths:
   * car1 is on the circumference of the circle A with radius r and with the middle point circle1
   * car2 is on the circumference of the circle B with radius r and with the middle point circle2
   *
   * we need to search the points C and D, which are on the circumference of A and B respectively
   * and which are orthogonal to the line of circle1 to circle2
   * because these are the two arcs we need:
   * car1 goes to C (arc1), then from C to D (CD), and then D to car2 (arc2)
   *
   * the distance AB (other term for circle1 to circle2) equals to sqrt((y*y)/(x*x))
   * this distance has the same length as the distance CD
   *
   * now need the arc length of car1 to C (arc1) and car2 to D (arc2)
   * for that we use the formular: arcLength = centralAngle * r
   *
   * to get the centralAngle we take the angle from car1 to A and C to A and get their absolute difference
   * arctan( slope(carX, circleX) ), but we have to watch out something,
   * if the carX is to the left of the circleX,
   * we have to wrap this around 180 degrees
   * we do the same thing for C/D to A/B
   * then we get the absolute difference between these two values to get centralAngle
   *
   * orientation: (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
   */

  // #region get circles
  // the right cirlces of start car and end car
  let A: pos = getRightCircle(car1, r);
  let B: pos = getRightCircle(car2, r);
  // #endregion

  // #region get linear distances
  // distance between point A and B (circle1 and circle2)
  const AB: number = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
  const CD: number = AB; // distance CD is the same as the one from AB
  // #endregion

  // #region get simple (outer) angles
  // the angle the car has to the circle if you trace around the circumference
  const startCarToAAngle: rad = correctRad(
    Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x)
  );
  const endCarToBAngle: rad = correctRad(
    Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x)
  );
  // the angle around the circle to C or D
  const cOrDAngle: rad = correctRad(
    Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2
  );
  // its mirror NOT C/D Prime'
  const cOrDAngle2: rad = correctRad(
    Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2
  );

  // #region get inner angles
  const innerAngleStartC: rad = Math.abs(cOrDAngle - startCarToAAngle);
  const innerAngleStartCPrime: rad = Math.PI * 2 - innerAngleStartC;
  //if (startCarToAAngle > cOrDAngle) innerAngleStartC = Math.PI*2 - ...
  //else innerAngleStartC = ...

  // same for the other side
  const innerAngleDEnd: rad = Math.abs(cOrDAngle - endCarToBAngle);
  const innerAngleDPrimeEnd = Math.PI * 2 - innerAngleDEnd;
  // #endregion

  // Length=radius*innerAngle
  const lengthArc1: number = r * correctRad(innerAngleStartC); // some code
  const lengthArc2: number = r * correctRad(innerAngleDEnd);

  const lengthArcPrime1: number = r * correctRad(innerAngleStartCPrime); // some code
  const lengthArcPrime2: number = r * correctRad(innerAngleDPrimeEnd);

  // newX = oldX + v * cos(theta)

  // TODO check if it is forwards or backwards
  console.log(
    'path lengths: ',
    Math.round(lengthArc1 + lengthArc2 + CD),
    Math.round(lengthArcPrime1 + lengthArc2 + CD),
    Math.round(lengthArcPrime2 + lengthArc1 + CD),
    Math.round(lengthArcPrime1 + lengthArcPrime2 + CD)
  );

  return {
    startCarToAAngle: startCarToAAngle,
    endCarToBAngle: endCarToBAngle,
    cOrDAngle: cOrDAngle,
    innerAngleStartC: innerAngleStartC,
    innerAngleDEnd: innerAngleDEnd,
    innerAngleStartCPrime: innerAngleStartCPrime,
    innerAngleDPrimeEnd: innerAngleDPrimeEnd,
    lengthArc1: lengthArc1,
    lengthArc2: lengthArc2,
    lengthArcPrime1: lengthArcPrime1,
    lengthArcPrime2: lengthArcPrime2,
    cOrDAngle2: cOrDAngle2,
    lengthTotalDistance: lengthArc1 + CD + lengthArc2
  } as unknown as number;
  //return lengthArc1 + CD + lengthArc2;
}

//console.log('total length: ', getRSR(startCar, goalCar));

// LSL, lsl paths
function getLSL(circle1: pos, circle2: pos) {}

// LSR, RSL, lsr, rsl
function getLSRorRLS(circle1: pos, circle2: pos) {}
// #endregion
