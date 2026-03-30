import express from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET كل الخدمات
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("services").select("*"); // ✅ هنا الإصلاح
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// GET خدماتي (محمي)
router.get("/my-services", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// POST إضافة خدمة جديدة (محمي)
router.post("/", requireAuth, async (req, res) => {
  const { title, description, price, location } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: "Title and price are required" });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([{ user_id: req.user.id, title, description, price, location }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT تعديل خدمة (محمي)
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, price, location } = req.body;

  if (!title && !description && !price && !location) {
    return res.status(400).json({ error: "يجب إرسال حقل واحد على الأقل للتعديل" });
  }

  const { data, error } = await supabase
    .from("services")
    .update({ title, description, price, location })
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });

  if (data.length === 0) {
    return res.status(404).json({ error: "الخدمة غير موجودة أو غير مصرح" });
  }

  res.json({ message: "تم التعديل بنجاح", updated: data[0] });
});

// DELETE خدمة (محمي) ✅ إصلاح: كان داخل PUT بالغلط
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json(error);

  res.json({ message: "Service deleted ✅" });
});

export default router;