import { createRouter, createWebHistory } from 'vue-router'

const PublicLayout = () => import('@/views/public/PublicLayout.vue')
const AdminLayout = () => import('@/views/admin/AdminLayout.vue')

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/public/Home.vue') },
      { path: 'entrenamientos', name: 'entrenamientos', component: () => import('@/views/public/Trainings.vue') },
      { path: 'categoria/:cat', name: 'categoria', component: () => import('@/views/public/Category.vue'), props: true },
      { path: 'campeonatos', name: 'campeonatos', component: () => import('@/views/public/Championships.vue') },
      { path: 'galeria', name: 'galeria', component: () => import('@/views/public/Gallery.vue') },
      { path: 'contacto', name: 'contacto', component: () => import('@/views/public/Contact.vue') },
      { path: ':pathMatch(.*)*', name: 'notfound', component: () => import('@/views/public/NotFound.vue') },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: '', redirect: { name: 'admin-portada' } },
      { path: 'portada', name: 'admin-portada', component: () => import('@/views/admin/Cover.vue') },
      { path: 'categorias', name: 'admin-categorias', component: () => import('@/views/admin/AdminCategories.vue') },
      { path: 'entrenamientos', name: 'admin-entrenamientos', component: () => import('@/views/admin/AdminTrainings.vue') },
      { path: 'jugadores', name: 'admin-jugadores', component: () => import('@/views/admin/Players.vue') },
      { path: 'campeonatos', name: 'admin-campeonatos', component: () => import('@/views/admin/AdminChampionships.vue') },
      { path: 'galeria', name: 'admin-galeria', component: () => import('@/views/admin/AdminGallery.vue') },
      { path: 'contacto', name: 'admin-contacto', component: () => import('@/views/admin/AdminContact.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
