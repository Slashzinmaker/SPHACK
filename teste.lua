-- ============================================
-- ESP + MENU + TELEPORT (MOBILE OPTIMIZED)
-- ============================================

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
repeat task.wait() until player

-- CONFIG
local ESP_ENABLED = true
local ESP_COLOR = Color3.fromRGB(255,0,0)

local espCache = {}

-- ================= ESP =================

local function getHRP(plr)
    local char = plr.Character or plr.CharacterAdded:Wait()
    return char:WaitForChild("HumanoidRootPart")
end

local function createESP(plr)
    if plr == player then return end

    local hrp = getHRP(plr)
    if hrp:FindFirstChild("ESP") then return end

    local bill = Instance.new("BillboardGui")
    bill.Name = "ESP"
    bill.Size = UDim2.new(0, 50, 0, 70)
    bill.AlwaysOnTop = true
    bill.Adornee = hrp
    bill.StudsOffset = Vector3.new(0,1.5,0) -- AJUSTADO (antes alto demais)

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(1,0,1,0)
    frame.BackgroundTransparency = 0.5
    frame.BackgroundColor3 = ESP_COLOR
    frame.BorderSizePixel = 2
    frame.BorderColor3 = ESP_COLOR
    frame.Parent = bill

    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(1,0,0,16)
    name.Position = UDim2.new(0,0,-0.4,0)
    name.BackgroundTransparency = 1
    name.Text = plr.Name
    name.TextScaled = true
    name.TextColor3 = Color3.new(1,1,1)
    name.Parent = bill

    local dist = Instance.new("TextLabel")
    dist.Size = UDim2.new(1,0,0,14)
    dist.Position = UDim2.new(0,0,1,0)
    dist.BackgroundTransparency = 1
    dist.TextScaled = true
    dist.TextColor3 = Color3.new(1,1,1)
    dist.Parent = bill

    bill.Parent = hrp

    local conn
    conn = RunService.RenderStepped:Connect(function()
        if not ESP_ENABLED then
            bill.Enabled = false
            return
        end

        bill.Enabled = true

        local myHRP = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
        if myHRP then
            local d = (myHRP.Position - hrp.Position).Magnitude
            dist.Text = math.floor(d).."m"
        end

        if not bill.Parent then
            conn:Disconnect()
        end
    end)

    espCache[plr] = {bill, conn}
end

local function removeESP(plr)
    local data = espCache[plr]
    if data then
        if data[1] then data[1]:Destroy() end
        if data[2] then data[2]:Disconnect() end
        espCache[plr] = nil
    end
end

local function refreshESP()
    for _,plr in pairs(Players:GetPlayers()) do
        if plr ~= player then
            if ESP_ENABLED then
                createESP(plr)
            else
                removeESP(plr)
            end
        end
    end
end

-- ================= TELEPORT =================

local selectedPlayer = nil

local function teleportTo(plr)
    if not plr then return end
    local myHRP = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    local targetHRP = plr.Character and plr.Character:FindFirstChild("HumanoidRootPart")

    if myHRP and targetHRP then
        myHRP.CFrame = targetHRP.CFrame * CFrame.new(0,0,3)
    end
end

-- ================= MENU =================

local gui = Instance.new("ScreenGui")
gui.Parent = game.CoreGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0,180,0,200)
frame.Position = UDim2.new(0,10,0,100)
frame.BackgroundColor3 = Color3.fromRGB(20,20,20)
frame.Parent = gui

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1,0,0,25)
title.BackgroundTransparency = 1
title.Text = "CONTROL"
title.TextColor3 = Color3.new(1,1,1)
title.Parent = frame

-- Checkbox ESP
local toggle = Instance.new("TextButton")
toggle.Size = UDim2.new(1,0,0,30)
toggle.Position = UDim2.new(0,0,0,30)
toggle.Text = "ESP: ON"
toggle.Parent = frame

toggle.MouseButton1Click:Connect(function()
    ESP_ENABLED = not ESP_ENABLED
    toggle.Text = "ESP: "..(ESP_ENABLED and "ON" or "OFF")
    refreshESP()
end)

-- Lista de players
local list = Instance.new("ScrollingFrame")
list.Size = UDim2.new(1,0,0,100)
list.Position = UDim2.new(0,0,0,70)
list.CanvasSize = UDim2.new(0,0,0,0)
list.Parent = frame

local layout = Instance.new("UIListLayout", list)

local function updateList()
    list:ClearAllChildren()
    layout.Parent = list

    for _,plr in pairs(Players:GetPlayers()) do
        if plr ~= player then
            local btn = Instance.new("TextButton")
            btn.Size = UDim2.new(1,0,0,25)
            btn.Text = plr.Name
            btn.Parent = list

            btn.MouseButton1Click:Connect(function()
                selectedPlayer = plr
            end)
        end
    end
end

-- Botão teleport
local tp = Instance.new("TextButton")
tp.Size = UDim2.new(1,0,0,30)
tp.Position = UDim2.new(0,0,1,-30)
tp.Text = "TELEPORT"
tp.Parent = frame

tp.MouseButton1Click:Connect(function()
    teleportTo(selectedPlayer)
end)

-- ================= EVENTOS =================

Players.PlayerAdded:Connect(function(plr)
    plr.CharacterAdded:Connect(function()
        task.wait(1)
        if ESP_ENABLED then
            createESP(plr)
        end
        updateList()
    end)
end)

Players.PlayerRemoving:Connect(function(plr)
    removeESP(plr)
    updateList()
end)

-- INIT
refreshESP()
updateList()
