-- CreateIndex
CREATE INDEX "Robot_ownerId_createdAt_idx" ON "Robot"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "RobotEvent_robotId_createdAt_idx" ON "RobotEvent"("robotId", "createdAt");
