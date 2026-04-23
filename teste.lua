-- ============================================
-- ESP + FOLLOW + MENU MODULAR (FINAL)
-- ============================================

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local CoreGui = game:GetService("CoreGui")

local LP = Players.LocalPlayer
repeat task.wait() until LP

-- ================= CONFIG =================

local STATE = {
	ESP = true,
	FOLLOW = false,
}

local selectedPlayer = nil
local espData = {}
local followConn

-- ================= HELPERS =================

local function getHRP(char)
	return char and char:FindFirstChild("HumanoidRootPart")
end

-- ================= ESP =================

local function removeESP(plr)
	if espData[plr] then
		if espData[plr].gui then espData[plr].gui:Destroy() end
		if espData[plr].conn then espData[plr].conn:Disconnect() end
		espData[plr] = nil
	end
end

local function createESP(plr)
	if plr == LP then return end
	removeESP(plr)

	if not STATE.ESP then return end

	local char = plr.Character
	if not char then return end

	local hrp = getHRP(char)
	if not hrp then return end

	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.new(0,100,0,45)
	gui.StudsOffset = Vector3.new(0,2,0)
	gui.AlwaysOnTop = true
	gui.Adornee = hrp
	gui.Parent = hrp

	local box = Instance.new("Frame", gui)
	box.Size = UDim2.new(1,0,1,0)
	box.BackgroundTransparency = 0.6
	box.BackgroundColor3 = Color3.fromRGB(0,0,0)

	local stroke = Instance.new("UIStroke", box)
	stroke.Color = Color3.fromRGB(0,120,255)

	local name = Instance.new("TextLabel", gui)
	name.Size = UDim2.new(1,0,0,14)
	name.Position = UDim2.new(0,0,-0.3,0)
	name.BackgroundTransparency = 1
	name.Text = plr.Name
	name.TextScaled = true

	local dist = Instance.new("TextLabel", gui)
	dist.Size = UDim2.new(1,0,0,14)
	dist.Position = UDim2.new(0,0,1,0)
	dist.BackgroundTransparency = 1
	dist.TextScaled = true

	local conn = RunService.Heartbeat:Connect(function()
		if not STATE.ESP then
			gui.Enabled = false
			return
		end

		gui.Enabled = true

		local myHRP = getHRP(LP.Character)
		if myHRP then
			dist.Text = math.floor((myHRP.Position - hrp.Position).Magnitude).."m"
		end
	end)

	espData[plr] = {gui = gui, conn = conn}
end

local function refreshESP()
	for _,plr in pairs(Players:GetPlayers()) do
		createESP(plr)
	end
end

-- ================= FOLLOW =================

local function stopFollow()
	STATE.FOLLOW = false

	if followConn then
		followConn:Disconnect()
		followConn = nil
	end

	local hrp = getHRP(LP.Character)
	if hrp then hrp.Anchored = false end
end

local function startFollow(plr)
	if not plr then return end
	stopFollow()

	STATE.FOLLOW = true

	local myHRP = getHRP(LP.Character)
	if not myHRP then return end

	myHRP.Anchored = true

	followConn = RunService.Heartbeat:Connect(function()
		local targetHRP = getHRP(plr.Character)
		if targetHRP then
			myHRP.CFrame = targetHRP.CFrame * CFrame.new(0,3,2)
		end
	end)
end

-- ================= UI =================

local gui = Instance.new("ScreenGui", CoreGui)

-- BOLHA
local bubble = Instance.new("TextButton", gui)
bubble.Size = UDim2.new(0,45,0,45)
bubble.Position = UDim2.new(0,20,0,200)
bubble.BackgroundColor3 = Color3.fromRGB(0,120,255)
bubble.Text = ""
bubble.Visible = false
Instance.new("UICorner", bubble).CornerRadius = UDim.new(1,0)

-- MENU
local main = Instance.new("Frame", gui)
main.Size = UDim2.new(0,320,0,220)
main.Position = UDim2.new(0,20,0,120)
main.BackgroundColor3 = Color3.fromRGB(10,10,10)

Instance.new("UICorner", main)
Instance.new("UIStroke", main).Color = Color3.fromRGB(0,120,255)

-- TOP
local top = Instance.new("Frame", main)
top.Size = UDim2.new(1,0,0,30)
top.BackgroundColor3 = Color3.fromRGB(15,15,15)

local title = Instance.new("TextLabel", top)
title.Size = UDim2.new(1,-40,1,0)
title.Text = "CONTROL"
title.BackgroundTransparency = 1

local minBtn = Instance.new("TextButton", top)
minBtn.Size = UDim2.new(0,30,1,0)
minBtn.Position = UDim2.new(1,-30,0,0)
minBtn.Text = "-"

-- BOTÕES
local espBtn = Instance.new("TextButton", main)
espBtn.Size = UDim2.new(0.48,0,0,30)
espBtn.Position = UDim2.new(0.02,0,0,40)

local followBtn = Instance.new("TextButton", main)
followBtn.Size = UDim2.new(0.48,0,0,30)
followBtn.Position = UDim2.new(0.5,0,0,40)

-- LISTA
local list = Instance.new("ScrollingFrame", main)
list.Size = UDim2.new(1,-20,0,110)
list.Position = UDim2.new(0,10,0,80)

local layout = Instance.new("UIListLayout", list)

-- ================= UI LOGIC =================

local function updateUI()
	espBtn.Text = "ESP: "..(STATE.ESP and "ON" or "OFF")
	followBtn.Text = "SEGUIR: "..(STATE.FOLLOW and "ON" or "OFF")
end

local function refreshList()
	list:ClearAllChildren()
	layout.Parent = list

	for _,plr in pairs(Players:GetPlayers()) do
		if plr ~= LP then
			local b = Instance.new("TextButton")
			b.Size = UDim2.new(1,0,0,25)
			b.Text = plr.Name
			b.Parent = list

			b.MouseButton1Click:Connect(function()
				selectedPlayer = plr
			end)
		end
	end
end

-- ================= EVENTS =================

espBtn.MouseButton1Click:Connect(function()
	STATE.ESP = not STATE.ESP
	refreshESP()
	updateUI()
end)

followBtn.MouseButton1Click:Connect(function()
	if STATE.FOLLOW then
		stopFollow()
	else
		startFollow(selectedPlayer)
	end
	updateUI()
end)

minBtn.MouseButton1Click:Connect(function()
	main.Visible = false
	bubble.Visible = true
end)

bubble.MouseButton1Click:Connect(function()
	main.Visible = true
	bubble.Visible = false
end)

-- DRAG
local dragging, dragStart, startPos

top.InputBegan:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.Touch then
		dragging = true
		dragStart = i.Position
		startPos = main.Position
	end
end)

UIS.InputChanged:Connect(function(i)
	if dragging and i.UserInputType == Enum.UserInputType.Touch then
		local delta = i.Position - dragStart
		main.Position = UDim2.new(0,startPos.X.Offset+delta.X,0,startPos.Y.Offset+delta.Y)
	end
end)

UIS.InputEnded:Connect(function(i)
	if i.UserInputType == Enum.UserInputType.Touch then
		dragging = false
	end
end)

-- ================= INIT =================

refreshESP()
refreshList()
updateUI()

Players.PlayerAdded:Connect(refreshList)
Players.PlayerRemoving:Connect(refreshList)
