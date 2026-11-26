const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); 

const scoreText = document.getElementById("score"); 
const bestText = document.getElementById("best"); 
const overlay = document.getElementById("overlay");  
const overlayTitle = document.getElementById("overlayTitle"); 
const overlayText = document.getElementById("overlayText");
const playButton = document.getElementById("playButton");
const soundButton = document.getElementById("soundButton");
const powerupStatus = document.getElementById("powerupStatus");

const WIDTH = canvas.width; 
const HEIGHT = canvas.height; 
const GROUND_HEIGHT = 90;  

let gameState = "ready"; 
let score = 0;
let bestScore = Number(localStorage.getItem("skyHopperBest") || 0);   
let soundEnabled = true;
let audioContext;

let bird;
let pipes;
let powerups;
let spawnTimer;
let powerupTimer;
let gameSpeed; 
let groundOffset;
let activePowerup;
let gapModifier = 0;
let pipeEffectTime = 0;
let unstableTime = 0;
let unstableDirection = 1;
let bonusPoints = 0;
