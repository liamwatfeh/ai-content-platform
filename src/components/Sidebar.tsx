"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentIcon,
  SparklesIcon,
  CogIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Whitepapers", href: "/whitepapers", icon: DocumentIcon },
  { name: "Generate Content", href: "/generate-content", icon: SparklesIcon },
  { name: "Agent Config", href: "/agent-config", icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, sidebarOpen, setSidebarOpen } =
    useSidebar();

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  const SidebarContent = () => (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex h-full flex-col bg-gradient-to-r from-[#e2fcff] to-white rounded-2xl shadow-lg shadow-blue-100/40 border border-blue-50 m-2 relative"
    >
      {/* Collapse Toggle Button - repositioned to avoid overlap */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={classNames(
          "absolute bg-white rounded-full p-1.5 shadow-md border border-blue-100 hover:bg-blue-50 transition-all duration-200 z-10",
          isCollapsed
            ? "-right-3 top-20" // Position below the logo when collapsed
            : "-right-3 top-8" // Position at top when expanded
        )}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-blue-600" />
        )}
      </button>

      {/* Logo Section */}
      <div
        className={classNames(
          "flex flex-col items-center pt-8 pb-6",
          isCollapsed ? "px-3" : "px-6"
        )}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={classNames(
            "bg-blue-50 rounded-full ring-1 ring-blue-100 shadow-sm mb-4",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          <div
            className={classNames(
              "relative",
              isCollapsed ? "w-8 h-8" : "w-12 h-12"
            )}
          >
            <Image
              src="/content-brain-logo.svg"
              alt="Content Brain"
              width={isCollapsed ? 32 : 48}
              height={isCollapsed ? 32 : 48}
              className={isCollapsed ? "w-8 h-8" : "w-12 h-12"}
            />
          </div>
        </motion.div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-center"
          >
            <h1 className="text-xl font-bold text-gray-900 font-unbounded tracking-tight">
              Content Brain
            </h1>
            <p className="text-xs text-gray-500 font-archivo mt-1 tracking-wide">
              AI Content Platform
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={classNames(
          "flex flex-1 flex-col space-y-1",
          isCollapsed ? "px-2" : "px-4"
        )}
      >
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative group"
              title={isCollapsed ? item.name : undefined}
            >
              <motion.div
                className={classNames(
                  "flex items-center gap-x-3 rounded-xl transition-all duration-200 relative",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  "text-sm font-medium font-archivo",
                  isActive
                    ? "text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                )}
                whileHover={{ x: isCollapsed ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Enhanced animated pill background for active state */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#e2fcff] to-blue-50/80 rounded-xl border border-blue-200/60 shadow-md"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Hover state background */}
                <motion.div
                  className="absolute inset-0 bg-white/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  initial={false}
                />

                <item.icon
                  className={classNames(
                    "h-5 w-5 shrink-0 transition-colors duration-200 relative z-10",
                    isActive
                      ? "text-blue-600 drop-shadow-sm"
                      : "text-gray-400 group-hover:text-gray-600"
                  )}
                  aria-hidden="true"
                />

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className={classNames(
                      "relative z-10 tracking-wide transition-all duration-200",
                      isActive ? "font-semibold text-blue-800" : ""
                    )}
                  >
                    {item.name}
                  </motion.span>
                )}

                {/* Active indicator dot */}
                {isActive && !isCollapsed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full z-10"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="px-4 pb-6"
        >
          <div className="flex items-center gap-x-3 rounded-xl px-4 py-3 hover:bg-white/70 transition-colors duration-200 cursor-pointer border border-transparent hover:border-blue-100/50">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-1">
              <UserCircleIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 font-archivo">
                John Doe
              </p>
              <p className="text-xs text-gray-500 font-archivo tracking-wide">
                Pro Plan
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="w-72">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div
        className={classNames(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-lg px-4 shadow-sm">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 rounded-full p-1.5 ring-1 ring-blue-100">
              <div className="relative w-6 h-6">
                <Image
                  src="/content-brain-logo.svg"
                  alt="Content Brain"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            </div>
            <h1 className="text-base font-bold text-gray-900 font-unbounded">
              Content Brain
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}
