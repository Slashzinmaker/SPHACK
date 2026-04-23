-- ============================================
-- ESP + MENU FLUTUANTE + TELEPORT
-- ESTÁVEL / MOBILE FRIENDLY
-- ============================================

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local CoreGui = game:GetService("CoreGui")

local LP = Players.LocalPlayer
repeat task.wait() until LP

-- ===================== CONFIG =====================

local espEnabled = true
local espColor = Color3.fromRGB(0, 140, 255) -- azul
local menuBg = Color3.fromRGB(10, 10, 10)
local menuStroke = Color3.fromRGB(0, 120, 255)

local selectedPlayer = nil
local espData = {} -- [player] = {charConn, gui, nameLabel, distLabel}

-- ===================== HELPERS =====================

local function safeParentGui(gui)
	gui.ResetOnSpawn = false
	pcall(function()
		gui.Parent = LP:WaitForChild("PlayerGui")
	end)
	if not gui.Parent then
		pcall(function()
			gui.Parent = CoreGui
		end)
	end
end

local function getHRPFromCharacter(char)
	if not char then return nil end
	return char:FindFirstChild("HumanoidRootPart") or char:WaitForChild("HumanoidRootPart", 8)
end

local function cleanupESP(plr)
	local data = espData[plr]
	if not data then return end

	if data.gui then
		pcall(function()
			data.gui:Destroy()
		end)
	end

	espData[plr] = nil
end

local function cleanupAllESP()
	for plr, _ in pairs(espData) do
		cleanupESP(plr)
	end
end

local function createBillboard(plr, hrp)
	local gui = Instance.new("BillboardGui")
	gui.Name = "ESP_Box"
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.MaxDistance = 5000
	gui.Size = UDim2.new(0, 120, 0, 52)
	gui.StudsOffset = Vector3.new(0, 2.2, 0)
	gui.Adornee = hrp
	gui.Parent = hrp

	local box = Instance.new("Frame")
	box.Size = UDim2.new(1, 0, 1, 0)
	box.BackgroundTransparency = 0.55
	box.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
	box.BorderSizePixel = 0
	box.Parent = gui

	local stroke = Instance.new("UIStroke")
	stroke.Color = espColor
	stroke.Thickness = 2
	stroke.Parent = box

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = box

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Name = "Name"
	nameLabel.BackgroundTransparency = 1
	nameLabel.Size = UDim2.new(1, 0, 0, 16)
	nameLabel.Position = UDim2.new(0, 0, 0, -16)
	nameLabel.Font = Enum.Font.GothamBold
	nameLabel.TextSize = 13
	nameLabel.TextColor3 = Color3.new(1, 1, 1)
	nameLabel.TextStrokeTransparency = 0.25
	nameLabel.Text = plr.Name
	nameLabel.Parent = gui

	local distLabel = Instance.new("TextLabel")
	distLabel.Name = "Distance"
	distLabel.BackgroundTransparency = 1
	distLabel.Size = UDim2.new(1, 0, 0, 14)
	distLabel.Position = UDim2.new(0, 0, 1, 2)
	distLabel.Font = Enum.Font.Gotham
	distLabel.TextSize = 12
	distLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
	distLabel.TextStrokeTransparency = 0.5
	distLabel.Text = "0m"
	distLabel.Parent = gui

	return gui, nameLabel, distLabel
end

local function rebuildESPFor(plr)
	if plr == LP then return end
	cleanupESP(plr)

	if not espEnabled then
		return
	end

	local char = plr.Character
	if not char then return end

	local hrp = getHRPFromCharacter(char)
	if not hrp then return end

	local gui, nameLabel, distLabel = createBillboard(plr, hrp)

	espData[plr] = {
		gui = gui,
		nameLabel = nameLabel,
		distLabel = distLabel,
	}
end

local function hookPlayer(plr)
	if plr == LP then return end

	if espData[plr] and espData[plr].charConn then
		return
	end

	espData[plr] = espData[plr] or {}

	espData[plr].charConn = plr.CharacterAdded:Connect(function()
		task.wait(0.15)
		rebuildESPFor(plr)
	end)

	if plr.Character then
		task.spawn(function()
			task.wait(0.15)
			rebuildESPFor(plr)
		end)
	end
end

local function hookAllPlayers()
	for _, plr in ipairs(Players:GetPlayers()) do
		hookPlayer(plr)
	end
end

local function refreshAllESP()
	if espEnabled then
		for _, plr in ipairs(Players:GetPlayers()) do
			if plr ~= LP then
				rebuildESPFor(plr)
			end
		end
	else
		cleanupAllESP()
	end
end

local function teleportToPlayer(plr)
	if not plr then return end
	local myChar = LP.Character
	local targetChar = plr.Character
	if not myChar or not targetChar then return end

	local myHRP = getHRPFromCharacter(myChar)
	local targetHRP = getHRPFromCharacter(targetChar)
	if not myHRP or not targetHRP then return end

	myHRP.CFrame = targetHRP.CFrame * CFrame.new(0, 0, 3)
end

-- ===================== UI =====================

local gui = Instance.new("ScreenGui")
gui.Name = "ESPMenu"
safeParentGui(gui)

local main = Instance.new("Frame")
main.Size = UDim2.new(0, 280, 0, 360)
main.Position = UDim2.new(0, 18, 0, 120)
main.BackgroundColor3 = menuBg
main.BorderSizePixel = 0
main.Parent = gui

local mainCorner = Instance.new("UICorner")
mainCorner.CornerRadius = UDim.new(0, 10)
mainCorner.Parent = main

local mainStroke = Instance.new("UIStroke")
mainStroke.Color = menuStroke
mainStroke.Thickness = 1.5
mainStroke.Parent = main

local topBar = Instance.new("Frame")
topBar.Size = UDim2.new(1, 0, 0, 36)
topBar.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
topBar.BorderSizePixel = 0
topBar.Parent = main

local topBarCorner = Instance.new("UICorner")
topBarCorner.CornerRadius = UDim.new(0, 10)
topBarCorner.Parent = topBar

local topFix = Instance.new("Frame")
topFix.Size = UDim2.new(1, 0, 0, 10)
topFix.Position = UDim2.new(0, 0, 1, -10)
topFix.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
topFix.BorderSizePixel = 0
topFix.Parent = topBar

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Size = UDim2.new(1, -16, 1, 0)
title.Position = UDim2.new(0, 12, 0, 0)
title.Font = Enum.Font.GothamBold
title.TextSize = 15
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextColor3 = Color3.new(1, 1, 1)
title.Text = "CONTROL PANEL"
title.Parent = topBar

local dragHint = Instance.new("TextLabel")
dragHint.BackgroundTransparency = 1
dragHint.Size = UDim2.new(0, 90, 1, 0)
dragHint.Position = UDim2.new(1, -100, 0, 0)
dragHint.Font = Enum.Font.Gotham
dragHint.TextSize = 11
dragHint.TextXAlignment = Enum.TextXAlignment.Right
dragHint.TextColor3 = Color3.fromRGB(120, 180, 255)
dragHint.Text = "ARRASTAR"
dragHint.Parent = topBar

local divider = Instance.new("Frame")
divider.Size = UDim2.new(1, -16, 0, 1)
divider.Position = UDim2.new(0, 8, 0, 44)
divider.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
divider.BorderSizePixel = 0
divider.Parent = main

local espBtn = Instance.new("TextButton")
espBtn.Size = UDim2.new(1, -16, 0, 36)
espBtn.Position = UDim2.new(0, 8, 0, 50)
espBtn.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
espBtn.BorderSizePixel = 0
espBtn.AutoButtonColor = false
espBtn.Font = Enum.Font.GothamBold
espBtn.TextSize = 13
espBtn.TextColor3 = Color3.new(1, 1, 1)
espBtn.Parent = main

local espBtnCorner = Instance.new("UICorner")
espBtnCorner.CornerRadius = UDim.new(0, 8)
espBtnCorner.Parent = espBtn

local espBtnStroke = Instance.new("UIStroke")
espBtnStroke.Color = Color3.fromRGB(0, 120, 255)
espBtnStroke.Thickness = 1
espBtnStroke.Parent = espBtn

local espState = Instance.new("TextLabel")
espState.BackgroundTransparency = 1
espState.Size = UDim2.new(1, -12, 1, 0)
espState.Position = UDim2.new(0, 12, 0, 0)
espState.Font = Enum.Font.GothamBold
espState.TextSize = 13
espState.TextXAlignment = Enum.TextXAlignment.Left
espState.TextColor3 = Color3.new(1, 1, 1)
espState.Parent = espBtn

local playerLabel = Instance.new("TextLabel")
playerLabel.BackgroundTransparency = 1
playerLabel.Size = UDim2.new(1, -16, 0, 20)
playerLabel.Position = UDim2.new(0, 8, 0, 92)
playerLabel.Font = Enum.Font.GothamBold
playerLabel.TextSize = 12
playerLabel.TextXAlignment = Enum.TextXAlignment.Left
playerLabel.TextColor3 = Color3.fromRGB(120, 180, 255)
playerLabel.Text = "PLAYERS"
playerLabel.Parent = main

local list = Instance.new("ScrollingFrame")
list.Size = UDim2.new(1, -16, 0, 150)
list.Position = UDim2.new(0, 8, 0, 114)
list.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
list.BorderSizePixel = 0
list.ScrollBarThickness = 4
list.ScrollBarImageColor3 = Color3.fromRGB(0, 120, 255)
list.CanvasSize = UDim2.new(0, 0, 0, 0)
list.AutomaticCanvasSize = Enum.AutomaticSize.Y
list.Parent = main

local listCorner = Instance.new("UICorner")
listCorner.CornerRadius = UDim.new(0, 8)
listCorner.Parent = list

local listStroke = Instance.new("UIStroke")
listStroke.Color = Color3.fromRGB(35, 35, 35)
listStroke.Thickness = 1
listStroke.Parent = list

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 8)
padding.PaddingBottom = UDim.new(0, 8)
padding.PaddingLeft = UDim.new(0, 8)
padding.PaddingRight = UDim.new(0, 8)
padding.Parent = list

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 6)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = list

local selectedLabel = Instance.new("TextLabel")
selectedLabel.BackgroundTransparency = 1
selectedLabel.Size = UDim2.new(1, -16, 0, 20)
selectedLabel.Position = UDim2.new(0, 8, 0, 270)
selectedLabel.Font = Enum.Font.Gotham
selectedLabel.TextSize = 12
selectedLabel.TextXAlignment = Enum.TextXAlignment.Left
selectedLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
selectedLabel.Text = "Selecionado: nenhum"
selectedLabel.Parent = main

local tpBtn = Instance.new("TextButton")
tpBtn.Size = UDim2.new(1, -16, 0, 38)
tpBtn.Position = UDim2.new(0, 8, 1, -48)
tpBtn.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
tpBtn.BorderSizePixel = 0
tpBtn.AutoButtonColor = false
tpBtn.Font = Enum.Font.GothamBold
tpBtn.TextSize = 13
tpBtn.TextColor3 = Color3.new(1, 1, 1)
tpBtn.Text = "TELEPORTAR"
tpBtn.Parent = main

local tpCorner = Instance.new("UICorner")
tpCorner.CornerRadius = UDim.new(0, 8)
tpCorner.Parent = tpBtn

local tpStroke = Instance.new("UIStroke")
tpStroke.Color = Color3.fromRGB(120, 180, 255)
tpStroke.Thickness = 1
tpStroke.Parent = tpBtn

local function updateEspButton()
	if espEnabled then
		espState.Text = "[X] ESP: LIGADO"
		espBtn.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
	else
		espState.Text = "[ ] ESP: DESLIGADO"
		espBtn.BackgroundColor3 = Color3.fromRGB(14, 14, 14)
	end
end

local function makePlayerButton(plr)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(1, 0, 0, 32)
	btn.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
	btn.BorderSizePixel = 0
	btn.AutoButtonColor = false
	btn.Font = Enum.Font.Gotham
	btn.TextSize = 12
	btn.TextColor3 = Color3.new(1, 1, 1)
	btn.TextXAlignment = Enum.TextXAlignment.Left
	btn.Text = "   " .. plr.Name
	btn.Parent = list

	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 8)
	c.Parent = btn

	local s = Instance.new("UIStroke")
	s.Color = (selectedPlayer == plr) and Color3.fromRGB(0, 160, 255) or Color3.fromRGB(40, 40, 40)
	s.Thickness = 1
	s.Parent = btn

	btn.MouseButton1Click:Connect(function()
		selectedPlayer = plr
		selectedLabel.Text = "Selecionado: " .. plr.Name
		refreshPlayerList()
	end)
end

function refreshPlayerList()
	for _, child in ipairs(list:GetChildren()) do
		if child:IsA("TextButton") then
			child:Destroy()
		end
	end

	for _, plr in ipairs(Players:GetPlayers()) do
		if plr ~= LP then
			makePlayerButton(plr)
		end
	end

	task.defer(function()
		list.CanvasSize = UDim2.new(0, 0, 0, layout.AbsoluteContentSize.Y + 18)
	end)
end

espBtn.MouseButton1Click:Connect(function()
	espEnabled = not espEnabled
	updateEspButton()
	refreshAllESP()
end)

tpBtn.MouseButton1Click:Connect(function()
	teleportToPlayer(selectedPlayer)
end)

Players.PlayerAdded:Connect(function(plr)
	hookPlayer(plr)
	task.wait(0.2)
	refreshPlayerList()
	if espEnabled then
		rebuildESPFor(plr)
	end
end)

Players.PlayerRemoving:Connect(function(plr)
	if selectedPlayer == plr then
		selectedPlayer = nil
		selectedLabel.Text = "Selecionado: nenhum"
	end
	cleanupESP(plr)
	refreshPlayerList()
end)

layout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	list.CanvasSize = UDim2.new(0, 0, 0, layout.AbsoluteContentSize.Y + 18)
end)

-- ===================== DRAG MENU =====================

do
	local dragging = false
	local dragStart
	local startPos

	local function update(input)
		local delta = input.Position - dragStart
		main.Position = UDim2.new(
			startPos.X.Scale,
			startPos.X.Offset + delta.X,
			startPos.Y.Scale,
			startPos.Y.Offset + delta.Y
		)
	end

	topBar.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1
			or input.UserInputType == Enum.UserInputType.Touch then
			dragging = true
			dragStart = input.Position
			startPos = main.Position

			input.Changed:Connect(function()
				if input.UserInputState == Enum.UserInputState.End then
					dragging = false
				end
			end)
		end
	end)

	topBar.InputChanged:Connect(function(input)
		if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement
			or input.UserInputType == Enum.UserInputType.Touch) then
			update(input)
		end
	end)

	UIS.InputChanged:Connect(function(input)
		if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement
			or input.UserInputType == Enum.UserInputType.Touch) then
			update(input)
		end
	end)
end

-- ===================== ESP LOOP LEVE =====================

task.spawn(function()
	while true do
		task.wait(0.25)

		if espEnabled then
			local myChar = LP.Character
			local myHRP = myChar and myChar:FindFirstChild("HumanoidRootPart")

			for plr, data in pairs(espData) do
				if plr ~= LP and data and data.gui and data.gui.Parent then
					if data.nameLabel then
						data.nameLabel.Text = plr.Name
					end

					if data.distLabel then
						local tChar = plr.Character
						local tHRP = tChar and tChar:FindFirstChild("HumanoidRootPart")
						if myHRP and tHRP then
							local dist = math.floor((myHRP.Position - tHRP.Position).Magnitude)
							data.distLabel.Text = dist .. "m"
						else
							data.distLabel.Text = "?m"
						end
					end
				end
			end
		end
	end
end)

-- ===================== INIT =====================

hookAllPlayers()
refreshPlayerList()
updateEspButton()
refreshAllESP()
