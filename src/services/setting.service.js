const { PrismaClient } = require('../generated/prisma');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class SettingService {
  async getSettings() {
    try {
      const settings = await prisma.setting.findMany();
      return {
        success: true,
        data: settings,
        message: 'Configurações recuperadas com sucesso.',
      };
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || 'Erro ao buscar configurações.',
      };
    }
  }

  /**
   * Upload dinâmico de arquivos para o Supabase e atualização do Setting
   * @param {Object} files - Arquivos enviados (usando multer ou similar)
   * @returns {Promise<Object>}
   */
  async uploadSettingImages(files) {
    try {
      const bucket = process.env.SUPABASE_BUCKET;
      if (!bucket) throw new Error('Bucket do Supabase não configurado');

      const [setting] = await prisma.setting.findMany();
      if (!setting) throw new Error('Configuração não encontrada');

      const allowedFields = {
        logo: 'plataform_logo',
        banner: 'plataform_banner',
        banner_2: 'plataform_banner_2',
        banner_3: 'plataform_banner_3',
        register_banner: 'register_banner',
        login_banner: 'login_banner',
        deposit_banner: 'deposit_banner',
      };

      const updateData = {};

      // Loop dinâmico por campos válidos
      for (const field in files) {
        if (allowedFields[field]) {
          const file = files[field];
          const filePath = `settings/${field}/${Date.now()}-${file.originalname}`;
          const buffer = await fs.readFile(file.path);

          const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

          if (error) throw new Error(`Erro ao enviar ${field}: ${error.message}`);

          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          updateData[allowedFields[field]] = data.publicUrl;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          message: 'Nenhum arquivo válido enviado.',
        };
      }

      const updated = await prisma.setting.update({
        where: { id: setting.id },
        data: updateData,
      });

      return {
        success: true,
        data: updated,
        message: 'Imagens atualizadas com sucesso!',
      };
    } catch (error) {
      console.error('❌ Erro no upload de imagens:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || 'Erro ao enviar arquivos.',
      };
    }
  }

  async updateSetting(data) {
    try {
      const [setting] = await prisma.setting.findMany();
      if (!setting) throw new Error('Configuração não encontrada');

      const updateFields = {};
      if (typeof data.plataform_name === 'string' && data.plataform_name.trim()) {
        updateFields.plataform_name = data.plataform_name.trim();
      }
      if (typeof data.plataform_description === 'string' && data.plataform_description.trim()) {
        updateFields.plataform_description = data.plataform_description.trim();
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          data: null,
          message: 'Nenhum campo válido para atualizar.',
        };
      }

      const updated = await prisma.setting.update({
        where: { id: setting.id },
        data: updateFields,
      });

      return {
        success: true,
        data: updated,
        message: 'Configurações atualizadas com sucesso!',
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || 'Erro ao atualizar configurações.',
      };
    }
  }

  async updatePluggouSettings(data) {
    try {
      const [setting] = await prisma.setting.findMany();
      if (!setting) throw new Error('Configuração não encontrada');

      const updateFields = {};
      if (typeof data.pluggou_base_url === 'string' && data.pluggou_base_url.trim()) {
        updateFields.pluggou_base_url = data.pluggou_base_url.trim();
      }
      if (typeof data.pluggou_api_key === 'string' && data.pluggou_api_key.trim()) {
        updateFields.pluggou_api_key = data.pluggou_api_key.trim();
      }
      if (typeof data.pluggou_organization_id === 'string' && data.pluggou_organization_id.trim()) {
        updateFields.pluggou_organization_id = data.pluggou_organization_id.trim();
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          data: null,
          message: 'Nenhum campo válido para atualizar.',
        };
      }

      const updated = await prisma.setting.update({
        where: { id: setting.id },
        data: updateFields,
      });

      return {
        success: true,
        data: updated,
        message: 'Configurações do Pluggou atualizadas com sucesso!',
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações do Pluggou:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || 'Erro ao atualizar configurações do Pluggou.',
      };
    }
  }
}

module.exports = new SettingService();
