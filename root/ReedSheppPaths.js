// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths
// #endregion
// #region car data
// the turning radius r for the given car
var turningRadius = 10; // some arbitrary number for now
// if start car = (0, 0, 0) and end car = (x, 0, PI)
// then the RSR path has the length = turningRadius * PI + (|A-B|)
// start values of the car
var startCar = {
    pos: { x: 0, y: 0 },
    heading: degToRad(0) // 0 is right, 90 is north
};
// end/final values of the car
var goalCar = {
    pos: { x: 1, y: 1 },
    heading: degToRad(45)
};
// #endregion
// #region helper functions
function radToDeg(val) {
    return ((val * 180) / Math.PI) % 360;
}
function degToRad(val) {
    return ((val * Math.PI) / 180) % (2 * Math.PI);
}
function correctRad(val) {
    if (val < 0)
        return Math.abs((Math.PI * 2 + val) % (Math.PI * 2));
    else
        return Math.abs(val % (Math.PI * 2));
}
// #endregion
// #region get turning circles middle points from car values
// get the left/right middle point of the current car (if the car steers to the left, it turns around this point with the distance r)
function getLeftCircle(car, r) {
    if (r === void 0) { r = turningRadius; }
    return {
        x: car.pos.x + r * Math.cos(car.heading + Math.PI / 2),
        y: car.pos.y + r * Math.sin(car.heading + Math.PI / 2)
    };
}
function getRightCircle(car, r) {
    if (r === void 0) { r = turningRadius; }
    return {
        x: car.pos.x - r * Math.cos(car.heading + Math.PI / 2),
        y: car.pos.y - r * Math.sin(car.heading + Math.PI / 2)
    };
}
// #endregion
// #region CSC
// RSR, (rsr) paths
function getRSR(car1, car2, r) {
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
    if (car1 === void 0) { car1 = startCar; }
    if (car2 === void 0) { car2 = goalCar; }
    if (r === void 0) { r = turningRadius; }
    // #region get circles
    // the right cirlces of start car and end car
    var A = getRightCircle(car1, r);
    var B = getRightCircle(car2, r);
    // #endregion
    // #region get linear distances
    // distance between point A and B (circle1 and circle2)
    var AB = Math.sqrt(Math.pow((A.y - B.y), 2) + Math.pow((A.x - B.x), 2));
    var CD = AB; // distance CD is the same as the one from AB
    // #endregion
    // #region get simple (outer) angles
    // the angle the car has to the circle if you trace around the circumference
    var startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
    var endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
    // the angle around the circle to C or D
    var cOrDAngle = correctRad(Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2);
    // its mirror NOT C/D Prime'
    var cOrDAngle2 = correctRad(Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2);
    // #region get inner angles
    var innerAngleStartC = Math.abs(cOrDAngle - startCarToAAngle);
    var innerAngleStartCPrime = Math.PI * 2 - innerAngleStartC;
    //if (startCarToAAngle > cOrDAngle) innerAngleStartC = Math.PI*2 - ...
    //else innerAngleStartC = ...
    // same for the other side
    var innerAngleDEnd = Math.abs(cOrDAngle - endCarToBAngle);
    var innerAngleDPrimeEnd = Math.PI * 2 - innerAngleDEnd;
    // #endregion
    // Length=radius*innerAngle
    var lengthArc1 = r * correctRad(innerAngleStartC); // some code
    var lengthArc2 = r * correctRad(innerAngleDEnd);
    var lengthArcPrime1 = r * correctRad(innerAngleStartCPrime); // some code
    var lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
    // newX = oldX + v * cos(theta)
    var C = {
        x: A.x + Math.cos(cOrDAngle) * r,
        y: A.y + Math.sin(cOrDAngle) * r
    };
    // TODO check if it is forwards or backwards
    console.log('path lengths: ', C, lengthArc1, {
        x: car1.pos.x + lengthArc1 * Math.cos(car1.heading),
        y: car1.pos.y + lengthArc1 * Math.sin(car1.heading)
    }, {
        x: car1.pos.x - lengthArc1 * Math.cos(car1.heading),
        y: car1.pos.y - lengthArc1 * Math.sin(car1.heading)
    }, Math.round(lengthArc1 + lengthArc2 + CD), Math.round(lengthArcPrime1 + lengthArc2 + CD), Math.round(lengthArcPrime2 + lengthArc1 + CD), Math.round(lengthArcPrime1 + lengthArcPrime2 + CD));
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
    };
    //return lengthArc1 + CD + lengthArc2;
}
//console.log('total length: ', getRSR(startCar, goalCar));
// LSL, lsl paths
function getLSL(circle1, circle2) { }
// LSR, RSL, lsr, rsl
function getLSRorRLS(circle1, circle2) { }
// #endregion
