[XCX_NOITEMSELL] 
moduleMatches = 0xF882D5CF, 0x30B6E091 ; 1.0.1E, 1.0.2U

; ----------------------------------------------------------------------------
; WHO  : addItem__Q2_3cfs9CfItemBoxSFQ3_2fw9CItemType4TypeUiRQ2_3cfs12CfItemHandle
; WHAT : instead of selling item, return 0 (no systemlog)

0x02365A94 = li r31, 0 ; sellItem

; ----------------------------------------------------------------------------
; WHO  : cfs::CfPopManagerItem::updateTouchItem((void))
; WHAT : exit code if addItem returns 0 (blue gem not collected and no sound)

0x0238A1BC = _exit:
0x02389EF8 = beq _exit

[XCX_NOITEMSELL_1U] ######################################################################
moduleMatches = 0xAB97DE6B ; 1.0.1U

0x02365A24 = li r31, 0 ; sellItem

0x0238A14C = _exit:
0x02389E88 = beq _exit
