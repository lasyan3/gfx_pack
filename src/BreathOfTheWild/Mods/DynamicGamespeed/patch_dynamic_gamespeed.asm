[BotW_DynamicGamespeed_shared] # version independent code
moduleMatches = 0x6267BFD0, 0xFD091F9F, 0xD472D8A5

.origin = codecave

_fpsCalc:
stw	r0	,	0x78(r30)		#orig instruction we are replacing ;ticks between frame are currently in r12.
xoris r12, r12, 0x8000		#flip the sign bit of int ticks for floating point conversion
stw r12, 0xD4(r30)			#store sign flipped ticks in memory as lower half of double
lis r12, 0x4330				#create upper half of ticks double
stw r12, 0xD0(r30)			#store it in upper half of memory
lfd f10, 0xD0(r30)			#Load full double ticks into f10
lis r12, _convSub@ha		#load number to subtract from tick double...
lfd f12, _convSub@l(r12)	#...to create tick float into f12
fsub f10, f10, f12			#Do the subtraction
frsp f10, f10				#round to single precision and tick float is in f10
lis r12, _float1@ha			#Load float of 1...
lfs f12, _float1@l(r12)		#...into f12
fdivs f10, f12, f10			#divide 1 by ticks
lis r12, _busSpeed@ha		#load wii u bus speed...
lfs f12, _busSpeed@l(r12)	#...into f12
fmuls f10, f12, f10			#multiply bus speed to have current fps in f10. (1/ticks)*bus speed

mr r3, r30					#Make a copy of r30 so we can screw around with it
addi r3, r3, 0xE0			#Add offset to available memory space
stw r3, 0xD8(r30)			#Save our virgin memory address so we can retrieve it later
lwz r12, 0xDC(r30)			#load counter into r12
add r3, r3, r12				#add our counter to the offset for our memory location
stfsu f10, 0x04(r3)			#store current fps to memory location +4 and update efective address into r3
lfs f7, 0xE0(r30)			#Load fpsSum into f7
fadds f10, f10, f7			#Add currentFPS to fpsSum
addi r12, r12, 0x04			#Increment counter by 4
lis r11, _numBytes@ha
lwz r11, _numBytes@l(r11)
cmpw r12, r11				#Compare counter with 0x80(32 address from base memory location)
bne .+0x0C					#If we write our last current fps then 
lis r12, 0					#Zero our counter
lwz r3, 0xD8(r30)			#and reload our virgin memory offset
stw r12, 0xDC(r30)			#Store counter r12 to memory location
lfs f7, 0x04(r3)			#load oldest fps into f7
fsubs f10, f10, f7			#Subtract oldest fps from fpsSum
stfs f10, 0xE0(r30)			#store fpsSum back into it's memory address.
lis r12, _bufferSize@ha		#load 32 as a float ...
lfs f7, _bufferSize@l(r12)	#...into f7
fdivs f10, f10, f7			#divide fps sum by 32, the number of saved fps values, to get average fps over 32 frames
lis r12, _averageFPS@ha		#Store averaged fps...
stfs f10, _averageFPS@l(r12)#... into _averageFPS variable.  

lis r12, _float30@ha		#Setting up speed diviser. 30/current fps = game speed.  ex 30/60 = .5 game speed
lfs f12, _float30@l(r12)	#load float 30 into f12
fdivs f7, f12, f10			#do the division f10 is our current fps(now averaged)
lis r12, _lowlimit@ha		#set up a low limit to not set game speed below.  here: 10/30 = 3
lfs f12, _lowlimit@l(r12)	#Set 3 as the low limit into f12
lis r12, _speedDiv@ha		#prepare to store game speed into _speedDiv but wait.
fcmpu cr0, f7, f12			#compare Compare lowlimit with current working game speed
bge .+0x08					#If game speed is not being set below 10 fps...
b .+0x08					#then skip the next line
fmr f7, f12					#else overrite working current speed with low limit as new working current speed
stfs f7, _speedDiv@l(r12)	#store working current speed into _speedDiv

lis r12, _float30@ha		#An attempt to port arrow fix to fps++
lfs f12, _float30@l(r12)	#load float30 into f12
fmuls f10, f7, f12			#arrowsDiv = 30 * speedDiv
lis r12, _arrowsDiv@ha		
stfs f10, _arrowsDiv@l(r12)	#store the results
lis r12, _float.5@ha		#load float of .5 into f12
lfs f12, _float.5@l(r12)
fdivs f10, f12, f7			#arrowsDer = .5 / speedDiv
lis r12, _arrowsDer@ha
stfs f10, _arrowsDer@l(r12)	#store the results
blr							#return

_arrowTimeDrain:
lfs f1, 0xFC(r11)
lis r12, _speedDiv@ha
lfs f0, _speedDiv@l(r12)
fmuls f1, f1, f0
blr

# variables and constants

_lowlimit:
.float 3 ; Don't edit me!
_busSpeed:
.float 62156250
_averageFPS:
.int 0
_speedDiv:
.int 0
_bufferSize: 
.float ($amount_of_FPS_averaged)			
_numBytes: 
.int (4*$amount_of_FPS_averaged+4)

[BotwFPSV208] # offsets for V208
moduleMatches = 0x6267BFD0

# rodata constants in u-king.rpx
0x100005E0 = _float.5:
0x10000670 = _float1:
0x101E7964 = _float30:

0x10000BB0 = _convSub:

0x1021FCEC = _float32:

0x1001CCAC = _arrowsDiv:
0x1001CB18 = _arrowsDer:
0x1022F880 = _mapSpeed:
0x1031E2C0 = .float 2

# code patches in u-king.rpx
0x031FA97C = bla _fpsCalc
0x03793328 = nop
0x03793334 = nop
0x03793378 = lis r29, _speedDiv@ha
0x03793380 = lfs f0, _speedDiv@L(r29)
0x0379338C = nop
0x03415C1C = lis r12, _speedDiv@ha
0x03415C24 = lfs f0, _speedDiv@l(r12)
0x03415C2C = nop
0x02D90D2C = lis r10, _averageFPS@ha
0x02D90D30 = lfs f11, _averageFPS@l(r10)
0x02D90D88 = lis r10, _averageFPS@ha
0x02D90D8C = lfs f11, _averageFPS@l(r10)
0x02D5F760 = bla _arrowTimeDrain
0x037DC35C = lis r12, _speedDiv@ha		#Audio fix
0x037DC360 = lfs f13, _speedDiv@l(r12)
0x02F62B3C = lis r12, _speedDiv@ha		#map scroll fix
0x02F62B40 = lfs f0, _speedDiv@l(r12)

# break all forms of frame limiting
0x031FACD0 = nop ; disable vsync
0x031FACF4 = nop ; disable vsync loop

[BotwFPSv176V192] # offsets for V176 and V192
moduleMatches = 0xFD091F9F, 0xD472D8A5

# rodata constants in u-king.rpx
_float.5 = 0x100005E0
_float1 = 0x10000670
_float30 = 0x101E78F4
_float32 = 0x1025D1A8
_convSub = 0x10000BB0
_arrowsDiv = 0x1001CCAC
_arrowsDer = 0x1001CB18

# code patches in u-king.rpx
0x031F9E80 = bla _fpsCalc
0x03792620 = nop
0x0379262C = nop
0x03792670 = lis r29, _speedDiv@ha
0x03792678 = lfs f0, _speedDiv@l(r29)
0x03792684 = nop
0x03414EF8 = lis r12, _speedDiv@ha
0x03414F00 = lfs f0, _speedDiv@l(r12)
0x03414F08 = nop
0x02D90790 = lis r10, _averageFPS@ha
0x02D90794 = lfs f11, _averageFPS@l(r10)
0x02D907EC = lis r10, _averageFPS@ha
0x02D907F0 = lfs f11, _averageFPS@l(r10)
0x02D5F200 = bla _arrowTimeDrain
0x037DB654 = lis r12, _speedDiv@ha
0x037DB658 = lfs f13, _speedDiv@l(r12)

# break all forms of frame limiting
0x031FA1D4 = nop
0x031FA1F8 = nop
