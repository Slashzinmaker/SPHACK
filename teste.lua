-- ============================================
-- ESP + MENU FLUTUANTE + TELEPORT SEGUINDO
-- ESTÁVEL / MOBILE FRIENDLY / COM ABAS
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

-- Seguir player
local followEnabled = false
local followLoopConnection = nil

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

-- Teleport único (usado no botão)
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

-- Iniciar/parar follow loop
local function stopFollow()
	if followLoopConnection then
		followLoopConnection:Disconnect()
		followLoopConnection = nil
	end
	followEnabled = false
end

local function startFollow()
	if not selectedPlayer then
		followEnabled = false
		return
	end

	if followLoopConnection then
		followLoopConnection:Disconnect()
	end

	followEnabled = true
	followLoopConnection = RunService.Heartbeat:Connect(function()
		if not followEnabled then return end
		if not selectedPlayer then
			stopFollow()
			return
		end

		local myChar = LP.Character
		local targetChar = selectedPlayer.Character
		if not myChar or not targetChar then return end

		local myHRP = getHRPFromCharacter(myChar)
		local targetHRP = getHRPFromCharacter(targetChar)
		if not myHRP or not targetHRP then return end

		-- Teleporta para cima do alvo (2.5 studs acima)
		myHRP.CFrame = targetHRP.CFrame * CFrame.new(0, 2.5, 0)
	end)
end

local function toggleFollow()
	if followEnabled then
		stopFollow()
	else
		startFollow()
	end
	-- atualizar texto do botão (será feito na UI)
end

-- ===================== UI =====================

local gui = Instance.new("ScreenGui")
gui.Name = "ESPMenu"
safeParentGui(gui)

-- Menu principal
local main = Instance.new("Frame")
main.Size = UDim2.new(0, 320, 0, 320)   -- largura maior (320), altura menor (320)
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

-- Top bar
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
title.Size = UDim2.new(1, -40, 1, 0)
title.Position = UDim2.new(0, 12, 0, 0)
title.Font = Enum.Font.GothamBold
title.TextSize = 15
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextColor3 = Color3.new(1, 1, 1)
title.Text = "CONTROL PANEL"
title.Parent = topBar

-- Botão minimizar
local minBtn = Instance.new("TextButton")
minBtn.Size = UDim2.new(0, 24, 0, 24)
minBtn.Position = UDim2.new(1, -30, 0, 6)
minBtn.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
minBtn.BorderSizePixel = 0
minBtn.Text = "-"
minBtn.TextSize = 18
minBtn.TextColor3 = Color3.new(1, 1, 1)
minBtn.Font = Enum.Font.GothamBold
minBtn.Parent = topBar
local minCorner = Instance.new("UICorner")
minCorner.CornerRadius = UDim.new(1, 0)
minCorner.Parent = minBtn

-- Bolinha azul minimizada
local floatingBall = Instance.new("ImageButton")
floatingBall.Size = UDim2.new(0, 36, 0, 36)
floatingBall.Position = UDim2.new(0, 30, 0, 200)
floatingBall.BackgroundColor3 = Color3.fromRGB(0, 120, 255)
floatingBall.Image = "rbxasset://textures/ui/Controls/LoadingSpinner.png"
floatingBall.ImageColor3 = Color3.new(1, 1, 1)
floatingBall.ScaleType = Enum.ScaleType.Fit
floatingBall.BackgroundTransparency = 0
floatingBall.Visible = false
floatingBall.Parent = gui
local ballCorner = Instance.new("UICorner")
ballCorner.CornerRadius = UDim.new(1, 0)
ballCorner.Parent = floatingBall

-- Navegação por abas
local tabFrame = Instance.new("Frame")
tabFrame.Size = UDim2.new(1, -16, 0, 32)
tabFrame.Position = UDim2.new(0, 8, 0, 42)
tabFrame.BackgroundTransparency = 1
tabFrame.Parent = main

local tabESP = Instance.new("TextButton")
tabESP.Size = UDim2.new(0.5, -4, 1, 0)
tabESP.Position = UDim2.new(0, 0, 0, 0)
tabESP.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
tabESP.BorderSizePixel = 0
tabESP.Text = "ESP / TELEPORT"
tabESP.TextSize = 12
tabESP.Font = Enum.Font.GothamBold
tabESP.TextColor3 = Color3.new(1, 1, 1)
tabESP.Parent = tabFrame
local tabCorner1 = Instance.new("UICorner")
tabCorner1.CornerRadius = UDim.new(0, 6)
tabCorner1.Parent = tabESP

local tabFollow = Instance.new("TextButton")
tabFollow.Size = UDim2.new(0.5, -4, 1, 0)
tabFollow.Position = UDim2.new(0.5, 4, 0, 0)
tabFollow.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
tabFollow.BorderSizePixel = 0
tabFollow.Text = "SEGUIR"
tabFollow.TextSize = 12
tabFollow.Font = Enum.Font.GothamBold
tabFollow.TextColor3 = Color3.new(1, 1, 1)
tabFollow.Parent = tabFrame
local tabCorner2 = Instance.new("UICorner")
tabCorner2.CornerRadius = UDim.new(0, 6)
tabCorner2.Parent = tabFollow

-- Container de conteúdo (troca conforme aba)
local contentContainer = Instance.new("Frame")
contentContainer.Size = UDim2.new(1, -16, 1, -86)
contentContainer.Position = UDim2.new(0, 8, 0, 78)
contentContainer.BackgroundTransparency = 1
contentContainer.Parent = main

-- Aba ESP
local espContainer = Instance.new("ScrollingFrame")
espContainer.Size = UDim2.new(1, 0, 1, 0)
espContainer.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
espContainer.BorderSizePixel = 0
espContainer.ScrollBarThickness = 4
espContainer.ScrollBarImageColor3 = Color3.fromRGB(0, 120, 255)
espContainer.CanvasSize = UDim2.new(0, 0, 0, 0)
espContainer.AutomaticCanvasSize = Enum.AutomaticSize.Y
espContainer.Parent = contentContainer
local espContainerCorner = Instance.new("UICorner")
espContainerCorner.CornerRadius = UDim.new(0, 8)
espContainerCorner.Parent = espContainer
local espContainerStroke = Instance.new("UIStroke")
espContainerStroke.Color = Color3.fromRGB(35, 35, 35)
espContainerStroke.Thickness = 1
espContainerStroke.Parent = espContainer

local espListLayout = Instance.new("UIListLayout")
espListLayout.Padding = UDim.new(0, 8)
espListLayout.SortOrder = Enum.SortOrder.LayoutOrder
espListLayout.Parent = espContainer

local espPadding = Instance.new("UIPadding)
espPadding.PaddingTop = UDim.new(0, 8)
espPadding.PaddingBottom = UDim.new(0, 8)
espPadding.PaddingLeft = UDim.new(0, 8)
espPadding.PaddingRight = UDim.new(0, 8)
espPadding.Parent = espContainer

-- Botão ESP
local espBtn = Instance.new("TextButton")
espBtn.Size = UDim2.new(1, 0, 0, 36)
espBtn.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
espBtn.BorderSizePixel = 0
espBtn.AutoButtonColor = false
espBtn.Parent = espContainer
local espBtnCorner = Instance.new("UICorner")
espBtnCorner.CornerRadius = UDim.new(0, 8)
espBtnCorner.Parent = espBtn
local espBtnStroke = Instance.new("UIStroke")
espBtnStroke.Color = Color3.fromRGB(0, 120, 255)
espBtnStroke.Thickness = 1
espBtnStroke.Parent = espBtn
local espStateLabel = Instance.new("TextLabel")
espStateLabel.BackgroundTransparency = 1
espStateLabel.Size = UDim2.new(1, -12, 1, 0)
espStateLabel.Position = UDim2.new(0, 12, 0, 0)
espStateLabel.Font = Enum.Font.GothamBold
espStateLabel.TextSize = 13
espStateLabel.TextXAlignment = Enum.TextXAlignment.Left
espStateLabel.TextColor3 = Color3.new(1, 1, 1)
espStateLabel.Parent = espBtn

-- Label Players
local playerLabel = Instance.new("TextLabel")
playerLabel.BackgroundTransparency = 1
playerLabel.Size = UDim2.new(1, 0, 0, 20)
playerLabel.Font = Enum.Font.GothamBold
playerLabel.TextSize = 12
playerLabel.TextXAlignment = Enum.TextXAlignment.Left
playerLabel.TextColor3 = Color3.fromRGB(120, 180, 255)
playerLabel.Text = "PLAYERS"
playerLabel.Parent = espContainer

-- Lista de players
local listFrame = Instance.new("ScrollingFrame")
listFrame.Size = UDim2.new(1, 0, 0, 120)
listFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
listFrame.BorderSizePixel = 0
listFrame.ScrollBarThickness = 4
listFrame.ScrollBarImageColor3 = Color3.fromRGB(0, 120, 255)
listFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
listFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
listFrame.Parent = espContainer
local listCorner = Instance.new("UICorner")
listCorner.CornerRadius = UDim.new(0, 6)
listCorner.Parent = listFrame
local listStroke = Instance.new("UIStroke")
listStroke.Color = Color3.fromRGB(35, 35, 35)
listStroke.Thickness = 1
listStroke.Parent = listFrame
local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 4)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = listFrame
local listPadding = Instance.new("UIPadding")
listPadding.PaddingTop = UDim.new(0, 4)
listPadding.PaddingBottom = UDim.new(0, 4)
listPadding.PaddingLeft = UDim.new(0, 6)
listPadding.PaddingRight = UDim.new(0, 6)
listPadding.Parent = listFrame

local selectedLabelESP = Instance.new("TextLabel")
selectedLabelESP.BackgroundTransparency = 1
selectedLabelESP.Size = UDim2.new(1, 0, 0, 20)
selectedLabelESP.Font = Enum.Font.Gotham
selectedLabelESP.TextSize = 12
selectedLabelESP.TextXAlignment = Enum.TextXAlignment.Left
selectedLabelESP.TextColor3 = Color3.fromRGB(200, 200, 200)
selectedLabelESP.Text = "Selecionado: nenhum"
selectedLabelESP.Parent = espContainer

local tpBtn = Instance.new("TextButton")
tpBtn.Size = UDim2.new(1, 0, 0, 38)
tpBtn.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
tpBtn.BorderSizePixel = 0
tpBtn.AutoButtonColor = false
tpBtn.Font = Enum.Font.GothamBold
tpBtn.TextSize = 13
tpBtn.TextColor3 = Color3.new(1, 1, 1)
tpBtn.Text = "TELEPORTAR UNICO"
tpBtn.Parent = espContainer
local tpCorner = Instance.new("UICorner")
tpCorner.CornerRadius = UDim.new(0, 8)
tpCorner.Parent = tpBtn
local tpStroke = Instance.new("UIStroke")
tpStroke.Color = Color3.fromRGB(120, 180, 255)
tpStroke.Thickness = 1
tpStroke.Parent = tpBtn

-- Aba Seguir
local followContainer = Instance.new("Frame")
followContainer.Size = UDim2.new(1, 0, 1, 0)
followContainer.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
followContainer.BorderSizePixel = 0
followContainer.Visible = false
followContainer.Parent = contentContainer
local followCorner = Instance.new("UICorner")
followCorner.CornerRadius = UDim.new(0, 8)
followCorner.Parent = followContainer
local followStroke = Instance.new("UIStroke")
followStroke.Color = Color3.fromRGB(35, 35, 35)
followStroke.Thickness = 1
followStroke.Parent = followContainer

local followLayout = Instance.new("UIListLayout")
followLayout.Padding = UDim.new(0, 12)
followLayout.SortOrder = Enum.SortOrder.LayoutOrder
followLayout.Parent = followContainer
local followPadding = Instance.new("UIPadding")
followPadding.PaddingTop = UDim.new(0, 12)
followPadding.PaddingBottom = UDim.new(0, 12)
followPadding.PaddingLeft = UDim.new(0, 12)
followPadding.PaddingRight = UDim.new(0, 12)
followPadding.Parent = followContainer

local infoLabel = Instance.new("TextLabel")
infoLabel.BackgroundTransparency = 1
infoLabel.Size = UDim2.new(1, 0, 0, 30)
infoLabel.Font = Enum.Font.Gotham
infoLabel.TextSize = 13
infoLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
infoLabel.Text = "Player selecionado:\n nenhum"
infoLabel.TextWrapped = true
infoLabel.Parent = followContainer

local followBtn = Instance.new("TextButton")
followBtn.Size = UDim2.new(1, 0, 0, 42)
followBtn.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
followBtn.BorderSizePixel = 0
followBtn.AutoButtonColor = false
followBtn.Font = Enum.Font.GothamBold
followBtn.TextSize = 14
followBtn.Text = "INICIAR SEGUIR"
followBtn.Parent = followContainer
local followBtnCorner = Instance.new("UICorner")
followBtnCorner.CornerRadius = UDim.new(0, 8)
followBtnCorner.Parent = followBtn
local followBtnStroke = Instance.new("UIStroke")
followBtnStroke.Color = Color3.fromRGB(120, 180, 255)
followBtnStroke.Thickness = 1
followBtnStroke.Parent = followBtn

local stopFollowBtn = Instance.new("TextButton")
stopFollowBtn.Size = UDim2.new(1, 0, 0, 42)
stopFollowBtn.BackgroundColor3 = Color3.fromRGB(120, 30, 30)
stopFollowBtn.BorderSizePixel = 0
stopFollowBtn.AutoButtonColor = false
stopFollowBtn.Font = Enum.Font.GothamBold
stopFollowBtn.TextSize = 14
stopFollowBtn.Text = "PARAR SEGUIR (fica no lugar)"
stopFollowBtn.Parent = followContainer
local stopCorner = Instance.new("UICorner")
stopCorner.CornerRadius = UDim.new(0, 8)
stopCorner.Parent = stopFollowBtn

-- Funções de UI
local function updateEspButton()
	if espEnabled then
		espStateLabel.Text = "[X] ESP: LIGADO"
		espBtn.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
	else
		espStateLabel.Text = "[ ] ESP: DESLIGADO"
		espBtn.BackgroundColor3 = Color3.fromRGB(14, 14, 14)
	end
end

local function updateFollowUI()
	if followEnabled then
		followBtn.Text = "SEGUINDO ATIVO"
		followBtn.BackgroundColor3 = Color3.fromRGB(0, 140, 80)
	else
		followBtn.Text = "INICIAR SEGUIR"
		followBtn.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
	end
end

local function updateSelectedDisplay()
	local name = selectedPlayer and selectedPlayer.Name or "nenhum"
	selectedLabelESP.Text = "Selecionado: " .. name
	infoLabel.Text = "Player selecionado:\n " .. name
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
	btn.Parent = listFrame

	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 8)
	c.Parent = btn

	local s = Instance.new("UIStroke")
	s.Color = (selectedPlayer == plr) and Color3.fromRGB(0, 160, 255) or Color3.fromRGB(40, 40, 40)
	s.Thickness = 1
	s.Parent = btn

	btn.MouseButton1Click:Connect(function()
		selectedPlayer = plr
		updateSelectedDisplay()
		refreshPlayerList()
		-- Se o follow estiver ativo, reinicia com novo target
		if followEnabled then
			startFollow()
		end
	end)
end

function refreshPlayerList()
	for _, child in ipairs(listFrame:GetChildren()) do
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
		listFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 12)
		espContainer.CanvasSize = UDim2.new(0, 0, 0, espListLayout.AbsoluteContentSize.Y + 20)
	end)
end

-- Eventos dos botões
espBtn.MouseButton1Click:Connect(function()
	espEnabled = not espEnabled
	updateEspButton()
	refreshAllESP()
end)

tpBtn.MouseButton1Click:Connect(function()
	teleportToPlayer(selectedPlayer)
end)

followBtn.MouseButton1Click:Connect(function()
	if not selectedPlayer then
		return
	end
	toggleFollow()
	updateFollowUI()
end)

stopFollowBtn.MouseButton1Click:Connect(function()
	if followEnabled then
		stopFollow()
		updateFollowUI()
	end
end)

-- Navegação abas
tabESP.MouseButton1Click:Connect(function()
	espContainer.Visible = true
	followContainer.Visible = false
	tabESP.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
	tabFollow.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
end)
tabFollow.MouseButton1Click:Connect(function()
	espContainer.Visible = false
	followContainer.Visible = true
	tabESP.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	tabFollow.BackgroundColor3 = Color3.fromRGB(0, 90, 180)
end)

-- Minimizar / Bolinha
local function minimizeMenu()
	main.Visible = false
	floatingBall.Visible = true
end

local function restoreMenu()
	main.Visible = true
	floatingBall.Visible = false
end

minBtn.MouseButton1Click:Connect(minimizeMenu)
floatingBall.MouseButton1Click:Connect(restoreMenu)

-- Arrastar menu
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

-- Arrastar bolinha
do
	local dragBall = false
	local dragStartBall, startPosBall

	local function updateBall(input)
		local delta = input.Position - dragStartBall
		floatingBall.Position = UDim2.new(
			startPosBall.X.Scale,
			startPosBall.X.Offset + delta.X,
			startPosBall.Y.Scale,
			startPosBall.Y.Offset + delta.Y
		)
	end

	floatingBall.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragBall = true
			dragStartBall = input.Position
			startPosBall = floatingBall.Position

			input.Changed:Connect(function()
				if input.UserInputState == Enum.UserInputState.End then
					dragBall = false
				end
			end)
		end
	end)

	UIS.InputChanged:Connect(function(input)
		if dragBall and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
			updateBall(input)
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
updateSelectedDisplay()
updateFollowUI()

-- Limpeza ao remover player
Players.PlayerRemoving:Connect(function(plr)
	if selectedPlayer == plr then
		selectedPlayer = nil
		updateSelectedDisplay()
		if followEnabled then stopFollow() updateFollowUI() end
	end
	cleanupESP(plr)
	refreshPlayerList()
end)

Players.PlayerAdded:Connect(function(plr)
	hookPlayer(plr)
	task.wait(0.2)
	refreshPlayerList()
	if espEnabled then rebuildESPFor(plr) end
end)

-- Ajuste automático do canvas
espListLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	espContainer.CanvasSize = UDim2.new(0, 0, 0, espListLayout.AbsoluteContentSize.Y + 20)
end)
listLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	listFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 12)
end)
followLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	followContainer.CanvasSize = UDim2.new(0, 0, 0, followLayout.AbsoluteContentSize.Y + 24)
end)
