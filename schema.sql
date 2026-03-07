CREATE DATABASE IF NOT EXISTS tecnior_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnior_website;

-- 1. Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'moderator', 'user') NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, role)
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2),
  price_label VARCHAR(100) DEFAULT 'Starting from',
  category VARCHAR(100),
  icon VARCHAR(50) DEFAULT 'Package',
  features JSON,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Job Openings
CREATE TABLE IF NOT EXISTS job_openings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(100) DEFAULT 'Remote',
  type VARCHAR(50) DEFAULT 'Full-time',
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Briefcase',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  job_id CHAR(36),
  job_title VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  status ENUM('pending','reviewing','shortlisted','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES job_openings(id) ON DELETE SET NULL
);

-- 5. Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  form_type ENUM('contact','consultation','support') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(100),
  subject VARCHAR(200),
  message TEXT,
  budget VARCHAR(50),
  preferred_date VARCHAR(20),
  preferred_time VARCHAR(20),
  service_interest VARCHAR(100),
  priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
  status ENUM('new','in_progress','resolved','closed') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Page SEO
CREATE TABLE IF NOT EXISTS page_seo (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  page_name VARCHAR(100) NOT NULL,
  page_path VARCHAR(255) UNIQUE NOT NULL,
  meta_title VARCHAR(200),
  meta_description TEXT,
  meta_keywords TEXT,
  og_title VARCHAR(200),
  og_description TEXT,
  og_image TEXT,
  og_type VARCHAR(50) DEFAULT 'website',
  canonical_url TEXT,
  robots VARCHAR(100) DEFAULT 'index, follow',
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  json_ld JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Social Links
CREATE TABLE IF NOT EXISTS social_links (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  platform VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon_svg TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_group VARCHAR(50) DEFAULT 'general',
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
